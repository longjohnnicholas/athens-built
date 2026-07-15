#!/usr/bin/env python3
"""Aggregate the Urban Atlas 2012 DHM for MapLibre fill extrusions."""

from __future__ import annotations

import argparse
import json
import math
import zipfile
from collections import defaultdict
from pathlib import Path

import numpy as np
import rasterio
from pyproj import Transformer
from rasterio.warp import transform_bounds
from rasterio.windows import Window, from_bounds as window_from_bounds


ATTICA_BBOX = (23.2, 37.6, 24.3, 38.4)
SOURCE_LABEL = "Urban Atlas 2012 Building Height (DHM), 10 m"
REQUESTED_CELL_SIZE_M = 100
FALLBACK_CELL_SIZE_M = 150
TARGET_BYTES = 2_500_000


def raster_uri(source_path: Path) -> str:
    """Return a Rasterio URI for a GeoTIFF or the DHM GeoTIFF in its archive."""

    if source_path.suffix.lower() != ".zip":
        return str(source_path)
    with zipfile.ZipFile(source_path) as archive:
        candidates = sorted(
            name
            for name in archive.namelist()
            if name.lower().endswith(".tif") and "dhm" in name.lower()
        )
    if len(candidates) != 1:
        raise RuntimeError(
            f"expected one DHM GeoTIFF in {source_path}, found {len(candidates)}"
        )
    return f"zip://{source_path.resolve()}!{candidates[0]}"


def clipped_raster(source):
    clip_bounds = transform_bounds(
        "EPSG:4326", source.crs, *ATTICA_BBOX, densify_pts=41
    )
    bounds = (
        max(source.bounds.left, clip_bounds[0]),
        max(source.bounds.bottom, clip_bounds[1]),
        min(source.bounds.right, clip_bounds[2]),
        min(source.bounds.top, clip_bounds[3]),
    )
    window = window_from_bounds(*bounds, source.transform)
    window = window.round_offsets().round_lengths()
    window = window.intersection(Window(0, 0, source.width, source.height))
    return source.read(1, window=window, masked=True), source.window_transform(window)


def aggregate_positive_means(data, source_cell_size_m: int, cell_size_m: int):
    block_size = cell_size_m // source_cell_size_m
    if block_size * source_cell_size_m != cell_size_m:
        raise ValueError("output cell size must be a multiple of source resolution")

    row_count = math.ceil(data.shape[0] / block_size)
    column_count = math.ceil(data.shape[1] / block_size)
    values = np.pad(
        data.astype("float32").filled(np.nan),
        (
            (0, row_count * block_size - data.shape[0]),
            (0, column_count * block_size - data.shape[1]),
        ),
        constant_values=np.nan,
    )
    positive = np.isfinite(values) & (values > 0)
    sums = np.where(positive, values, 0).reshape(
        row_count, block_size, column_count, block_size
    ).sum(axis=(1, 3))
    counts = positive.reshape(
        row_count, block_size, column_count, block_size
    ).sum(axis=(1, 3))
    means = np.zeros((row_count, column_count), dtype="float32")
    np.divide(sums, counts, out=means, where=counts > 0)
    return means, counts > 0, block_size


def build_payload(source, data, transform, cell_size_m: int):
    source_cell_size_m = int(round(abs(transform.a)))
    means, occupied, block_size = aggregate_positive_means(
        data, source_cell_size_m, cell_size_m
    )
    transformer = Transformer.from_crs(source.crs, "EPSG:4326", always_xy=True)
    polygons_by_height = defaultdict(list)

    for row, column in zip(*np.where(occupied)):
        left = transform.c + column * block_size * transform.a
        right = left + cell_size_m
        top = transform.f + row * block_size * transform.e
        bottom = top - cell_size_m
        longitudes, latitudes = transformer.transform(
            [left, right, right, left, left],
            [top, top, bottom, bottom, top],
        )
        ring = [
            [round(longitude, 5), round(latitude, 5)]
            for longitude, latitude in zip(longitudes, latitudes)
        ]
        height = round(float(means[row, column]), 1)
        polygons_by_height[height].append([ring])

    # Cells remain separate polygon rings. Grouping rings with the same 0.1 m
    # mean into MultiPolygon features removes repeated Feature/property syntax
    # without changing any cell geometry or extrusion height.
    features = [
        {
            "type": "Feature",
            "properties": {"h": height},
            "geometry": {"type": "MultiPolygon", "coordinates": polygons},
        }
        for height, polygons in sorted(polygons_by_height.items())
    ]
    payload = {
        "type": "FeatureCollection",
        "metadata": {
            "source": SOURCE_LABEL,
            "bbox_4326": list(ATTICA_BBOX),
            "requested_cell_size_m": REQUESTED_CELL_SIZE_M,
            "cell_size_m": cell_size_m,
            "cell_count": int(np.count_nonzero(occupied)),
            "height_statistic": "mean of positive source samples per cell",
            "height_precision_m": 0.1,
            "geometry_precision_degrees": 5,
            "representation": "cell rings grouped by equal h as MultiPolygon features",
        },
        "features": features,
    }
    encoded = (
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n"
    ).encode("utf-8")
    return payload, encoded


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "source",
        type=Path,
        help="Urban Atlas DHM GeoTIFF or the original ZIP archive",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/heights_grid_100m.geojson"),
    )
    return parser.parse_args()


def main():
    args = parse_args()
    attempts = []
    with rasterio.open(raster_uri(args.source)) as source:
        if source.crs is None or not source.crs.is_projected:
            raise RuntimeError("DHM must use a projected CRS for metre-based aggregation")
        data, transform = clipped_raster(source)
        payload = None
        encoded = None
        for cell_size_m in (REQUESTED_CELL_SIZE_M, FALLBACK_CELL_SIZE_M):
            payload, encoded = build_payload(
                source, data, transform, cell_size_m
            )
            attempts.append(
                {
                    "cell_size_m": cell_size_m,
                    "cell_count": payload["metadata"]["cell_count"],
                    "bytes": len(encoded),
                }
            )
            if len(encoded) <= TARGET_BYTES:
                break
        else:
            raise RuntimeError(
                f"150 m fallback exceeds {TARGET_BYTES:,} bytes: {len(encoded):,}"
            )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(encoded)
    print(
        json.dumps(
            {
                "output": str(args.output),
                "selected": attempts[-1],
                "attempts": attempts,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
