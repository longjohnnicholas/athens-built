#!/usr/bin/env python3
"""Build the Urban Atlas integration assets from extracted source archives."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import geopandas as gpd
import numpy as np
import rasterio
from PIL import Image
from pyproj import Transformer
from rasterio.transform import from_bounds
from rasterio.warp import Resampling, calculate_default_transform, reproject, transform_bounds
from rasterio.windows import Window, from_bounds as window_from_bounds
from shapely.geometry import MultiPoint, box, mapping


ATTICA_BBOX = (23.2, 37.6, 24.3, 38.4)
HEIGHT_COLORS = ("#DEE3E7", "#B8C2CA", "#8FA0AC", "#64798A", "#3C4F60")
HEIGHT_NODATA = np.uint16(65535)


def rounded_geometry(geometry, precision=5):
    """Return a GeoJSON geometry with compact, rounded coordinates."""

    def round_values(value):
        if isinstance(value, (list, tuple)):
            return [round_values(item) for item in value]
        return round(float(value), precision)

    geojson = mapping(geometry)
    geojson["coordinates"] = round_values(geojson["coordinates"])
    return geojson


def write_geojson(path, features):
    payload = {"type": "FeatureCollection", "features": features}
    path.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )


def bbox_geometry_in_crs(crs):
    return gpd.GeoSeries([box(*ATTICA_BBOX)], crs="EPSG:4326").to_crs(crs).iloc[0]


def build_green(lcu_path, output_path):
    green = gpd.read_file(lcu_path, where="code_2018 = '14100'")
    clip_box = bbox_geometry_in_crs(green.crs)
    green = green[green.intersects(clip_box)].copy()
    green.geometry = green.geometry.intersection(clip_box)
    green = green[~green.geometry.is_empty]

    chosen_tolerance = None
    source_count = len(green)
    for tolerance in (3, 5, 8, 12, 20):
        dissolved = green.geometry.union_all().simplify(tolerance, preserve_topology=True)
        dissolved_4326 = gpd.GeoSeries([dissolved], crs=green.crs).to_crs(4326).iloc[0]
        feature = {
            "type": "Feature",
            "properties": {
                "code_2018": "14100",
                "class_2018": "Green urban areas",
            },
            "geometry": rounded_geometry(dissolved_4326),
        }
        write_geojson(output_path, [feature])
        chosen_tolerance = tolerance
        if output_path.stat().st_size <= 1_200_000:
            break

    if output_path.stat().st_size > 1_200_000:
        raise RuntimeError(f"green output exceeds 1.2 MB: {output_path.stat().st_size}")
    return {
        "source_features": source_count,
        "simplify_tolerance_m": chosen_tolerance,
        "bytes": output_path.stat().st_size,
    }


def build_street_tree_texture(stl_path, output_path):
    layer = "EL001L1_ATHINA_UA2018_STL"
    clip_box = bbox_geometry_in_crs("EPSG:3035")
    trees = gpd.read_file(stl_path, layer=layer, bbox=clip_box.bounds)
    trees = trees[trees.intersects(clip_box)].copy()
    trees.geometry = trees.geometry.intersection(clip_box)
    trees = trees[~trees.geometry.is_empty]

    # The source is a canopy-polygon product. One representative point per
    # polygon preserves its street-tree texture at web-map scale without
    # implying a count of individual trees.
    trees_4326 = trees.to_crs(4326)
    trees_4326.geometry = trees_4326.geometry.intersection(box(*ATTICA_BBOX))
    trees_4326 = trees_4326[~trees_4326.geometry.is_empty]
    points_4326 = trees_4326.geometry.representative_point()
    rounded_points = sorted(
        {
            (round(point.x, 5), round(point.y, 5))
            for point in points_4326
            if ATTICA_BBOX[0] <= point.x <= ATTICA_BBOX[2]
            and ATTICA_BBOX[1] <= point.y <= ATTICA_BBOX[3]
        }
    )
    feature = {
        "type": "Feature",
        "properties": {
            "dataset": "Urban Atlas 2018 Street Tree Layer",
            "representation": "one representative point per canopy polygon",
        },
        "geometry": rounded_geometry(MultiPoint(rounded_points)),
    }
    write_geojson(output_path, [feature])
    return {
        "source_polygons": len(points_4326),
        "texture_points": len(rounded_points),
        "bytes": output_path.stat().st_size,
        "included": output_path.stat().st_size <= 1_500_000,
    }


def clipped_raster(source):
    clip_bounds = transform_bounds(
        "EPSG:4326", source.crs, *ATTICA_BBOX, densify_pts=41
    )
    left = max(source.bounds.left, clip_bounds[0])
    bottom = max(source.bounds.bottom, clip_bounds[1])
    right = min(source.bounds.right, clip_bounds[2])
    top = min(source.bounds.top, clip_bounds[3])
    window = window_from_bounds(left, bottom, right, top, source.transform)
    window = window.round_offsets().round_lengths()
    full = Window(0, 0, source.width, source.height)
    window = window.intersection(full)
    data = source.read(1, window=window, masked=True)
    return data, source.window_transform(window)


def build_height_json(data, transform, crs, output_dir):
    valid = data.compressed()
    valid = valid[valid > 0]
    histogram_ranges = [
        (0, 3, "0-3"),
        (3, 6, "3-6"),
        (6, 9, "6-9"),
        (9, 12, "9-12"),
        (12, 15, "12-15"),
        (15, 18, "15-18"),
        (18, 21, "18-21"),
        (21, 24, "21-24"),
        (24, 27, "24-27"),
        (27, 30, "27-30"),
    ]
    bins = []
    for lower, upper, label in histogram_ranges:
        if lower == 0:
            count = int(np.count_nonzero((valid > 0) & (valid <= upper)))
        else:
            count = int(np.count_nonzero((valid > lower) & (valid <= upper)))
        bins.append({"bin": label, "count": count})
    bins.append({"bin": "30+", "count": int(np.count_nonzero(valid > 30))})

    histogram = {
        "source": "Urban Atlas 2012 Building Height (DHM), 10 m",
        "note": "UA2012 DHM 10 m",
        "bbox_4326": list(ATTICA_BBOX),
        "cell_size_m": 10,
        "total_cells_in_extent": int(valid.size),
        "bins": bins,
    }
    (output_dir / "heights_histogram.json").write_text(
        json.dumps(histogram, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    target_latitude = 37.985
    transformer = Transformer.from_crs(crs, "EPSG:4326", always_xy=True)
    center_col = data.shape[1] // 2
    center_x = transform.c + (center_col + 0.5) * transform.a
    row_centers_y = transform.f + (np.arange(data.shape[0]) + 0.5) * transform.e
    center_lats = np.array(
        [transformer.transform(center_x, y)[1] for y in row_centers_y]
    )
    row = int(np.argmin(np.abs(center_lats - target_latitude)))
    row_values = data[row].filled(0)
    y = row_centers_y[row]
    points = []
    for column, height in enumerate(row_values):
        x = transform.c + (column + 0.5) * transform.a
        lon, _ = transformer.transform(x, y)
        points.append(
            {
                "lon": round(lon, 5),
                "distance_m": column * 10,
                "height_m": float(height),
            }
        )
    transect = {
        "source": "Urban Atlas 2012 Building Height (DHM), 10 m",
        "note": "UA2012 DHM 10 m",
        "latitude_target": target_latitude,
        "latitude_actual": round(float(center_lats[row]), 5),
        "sample_spacing_m": 10,
        "n_samples": len(points),
        "points": points,
    }
    (output_dir / "heights_transect.json").write_text(
        json.dumps(transect, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )


def build_height_overlay(dhm_path, output_dir):
    with rasterio.open(dhm_path) as source:
        data, source_transform = clipped_raster(source)
        build_height_json(data, source_transform, source.crs, output_dir)

        src = data.filled(HEIGHT_NODATA).astype(np.uint16)
        src_bounds = rasterio.transform.array_bounds(
            data.shape[0], data.shape[1], source_transform
        )
        default_transform, default_width, default_height = calculate_default_transform(
            source.crs,
            "EPSG:4326",
            data.shape[1],
            data.shape[0],
            *src_bounds,
        )
        scale = min(1.0, 4096 / default_width)
        width = max(1, int(round(default_width * scale)))
        height = max(1, int(round(default_height * scale)))
        west, south, east, north = transform_bounds(
            source.crs, "EPSG:4326", *src_bounds, densify_pts=101
        )
        destination_transform = from_bounds(west, south, east, north, width, height)
        destination = np.full((height, width), HEIGHT_NODATA, dtype=np.uint16)
        reproject(
            source=src,
            destination=destination,
            src_transform=source_transform,
            src_crs=source.crs,
            src_nodata=HEIGHT_NODATA,
            dst_transform=destination_transform,
            dst_crs="EPSG:4326",
            dst_nodata=HEIGHT_NODATA,
            resampling=Resampling.nearest,
        )

    indexed = np.zeros(destination.shape, dtype=np.uint8)
    indexed[(destination > 0) & (destination <= 3)] = 1
    indexed[(destination > 3) & (destination <= 9)] = 2
    indexed[(destination > 9) & (destination <= 15)] = 3
    indexed[(destination > 15) & (destination <= 21)] = 4
    indexed[(destination > 21) & (destination < HEIGHT_NODATA)] = 5
    rgba = np.zeros((*indexed.shape, 4), dtype=np.uint8)
    for band_index, color_value in enumerate(HEIGHT_COLORS, start=1):
        mask = indexed == band_index
        rgba[mask, :3] = [
            int(color_value[color_index : color_index + 2], 16)
            for color_index in (1, 3, 5)
        ]
        rgba[mask, 3] = 255
    image = Image.fromarray(rgba)
    png_path = output_dir / "heights_10m.png"
    image.save(png_path, optimize=True, compress_level=9)

    bounds = {
        "source": "Urban Atlas 2012 Building Height (DHM), 10 m",
        "crs": "EPSG:4326",
        "coordinates": [
            [round(west, 7), round(north, 7)],
            [round(east, 7), round(north, 7)],
            [round(east, 7), round(south, 7)],
            [round(west, 7), round(south, 7)],
        ],
        "width": width,
        "height": height,
    }
    (output_dir / "heights_10m_bounds.json").write_text(
        json.dumps(bounds, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    if png_path.stat().st_size > 2_500_000:
        raise RuntimeError(f"height PNG exceeds 2.5 MB: {png_path.stat().st_size}")
    return {
        "width": width,
        "height": height,
        "bytes": png_path.stat().st_size,
        "valid_source_cells": int(np.count_nonzero((src > 0) & (src < HEIGHT_NODATA))),
    }


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lcu", type=Path, required=True)
    parser.add_argument("--stl", type=Path, required=True)
    parser.add_argument("--dhm", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("data"))
    return parser.parse_args()


def main():
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    results = {
        "green": build_green(args.lcu, args.output_dir / "green_areas.geojson"),
        "street_tree_texture": build_street_tree_texture(
            args.stl, args.output_dir / "street_trees.geojson"
        ),
        "heights": build_height_overlay(args.dhm, args.output_dir),
    }
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
