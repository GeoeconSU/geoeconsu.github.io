# Homepage tools

## Add or replace a flip-book

The Barometer and India Horizon sections on the homepage are flip-books. Each book is a folder of page
images plus one entry in `assets/books/books.json`. One command builds both from a PDF:

```bash
python tools/build_book.py "docs/GRB Q4 2026.pdf" --slug grb-q4-2026 --group barometer --title "Geoeconomic Risk Barometer" --label "Q4 2026" --order 202604 --gate "GRB Q4 2026.pdf"
```

- `--group` decides which section shows the book: `barometer` or `india-horizon`.
- `--order` sorts editions, highest first. The first one is marked "Latest" and opens by default.
- `--gate` is the filename the report-request form sends. Add the same filename to `ALLOWED_PDFS` in
  `gsu-gate/src/index.js` and redeploy the worker, or the request is refused.
- By default the first 11 pages are rendered (cover and five spreads). Change with `--pages`; keep it odd.

India Horizon is currently built from the design team's artboard, because the PDF is not in the repo yet.
When it is, replace the book with:

```bash
python tools/build_book.py "docs/India Horizon October 2026.pdf" --slug india-horizon-2026-10 --group india-horizon --title "India Horizon" --label "October 2026" --order 202610
```

Remove a book with `python tools/build_book.py --slug <slug> --remove`.

Needs Python 3 with `pip install pymupdf pillow`.

## Files

| File | Job |
| --- | --- |
| `index-new.html` | page markup |
| `assets/site.css`, `assets/site.js` | styles and section behaviour |
| `assets/book.js` | the flip-book component (`GSUBook.mount`) |
| `assets/ambient.js` | dot-field background and the silver pointer |
| `assets/globe.classic.js`, `assets/land-mask.js` | hero globe and its continent mask |
| `assets/books/` | generated page images and manifest |
