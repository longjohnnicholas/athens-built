`pages.yml` in this folder is the intended GitHub Actions Pages-deploy
workflow (actions/upload-pages-artifact + actions/deploy-pages). It could
not be committed to `.github/workflows/` in the session that scaffolded
this repo because the `gh` CLI's OAuth token lacked the `workflow` scope,
and GitHub blocks any write (push or API) that touches `.github/workflows/`
without it.

Pages is currently serving from the classic branch source (`main`, `/`)
instead — see repo Settings → Pages.

To switch to Actions-based deploy:

1. Grant the scope: `gh auth refresh -h github.com -s workflow`, or add the
   file through the GitHub web UI (the web UI isn't subject to this OAuth
   App restriction).
2. Move this file to `.github/workflows/pages.yml`.
3. In repo Settings → Pages, change the source to "GitHub Actions".
4. Commit and push; the workflow will run on the next push to `main`.
