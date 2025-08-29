# Work-Order-EM (starter)

This repository is a starter frontend project to parse multiple Excel files (IW39, SUM57, DET, External Job, Planning, Equip Adm, Data1, Data2)
and render them in browser tables. It uses SheetJS (xlsx) on the client so you can host as a static site (GitHub Pages).

## Features
- Multiple file inputs (one per expected dataset)
- Parses first sheet of uploaded file (or best-matching sheet name)
- Renders parsed JSON as an HTML table
- Starter CSS for readability

## How to use
1. Clone this repo.
2. Serve it as static files (GitHub Pages, npx http-server, or any static host).
3. Open index.html and upload your Excel files.

## Next steps
- Field mapping and validation rules per uploaded file (based on your screenshot).
- Combine and join rows across sheets.
- Add filtering, sorting, and export (CSV).
- Persist uploads to Firebase / backend.
- Create ETL to normalize columns and save to a database.

## Deploy to GitHub Pages
1. Create a repository on GitHub.
2. Push these files to the main branch.
3. In repo Settings > Pages, set source to main / root.
