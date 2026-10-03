# ROPS social innovation snapshot

`catalog.json` contains the authoritative source URLs, 115 project descriptions, nine category labels, linked materials and videos, and the extracted text of the downloadable PDFs. `pdfs/` keeps the original source files with SHA-256 hashes recorded in the catalog. This is a versioned, immutable snapshot: application requests use the local catalog and do not fetch ROPS.

The initial snapshot downloaded 33 distinct PDFs successfully: 32 documents linked by the library and the 44-page *Mapa wyzwań społecznych*. This includes documents reused by multiple projects, such as licensing guidance. There are 26 project entries with YouTube links. The catalog is approximately 1.6 MB; original PDF files total approximately 41 MB. This size suits a bounded local keyword index rather than a managed external search service or adding the entire corpus to each model prompt.

## Source boundaries

- ROPS reports that the library is under reconstruction and some material links are inactive. 82 project pages have no active PDF links; their source descriptions remain available. An absent link is not proof that no implementation materials exist.
- Project pages typically describe the solution, problem, target beneficiaries, potential implementing organisations, test results, and authors. Test-result claims are statements by the source, not independently verified clinical evidence.
- The challenge map provides national background data, thematic priorities, references and example personas. Its eight themes are family/foster care, homelessness, disability, poverty, migrant integration, health, mental health, and seniors. It does **not** provide a validated score for comparing or ranking these projects. Statistics in this snapshot are historical and should retain their stated dates.
- Library entries describe reusable innovations and models. They do not establish that a local provider currently runs the activity, that registration is open, or that an individual is eligible for funding.
- The two entries titled *Dialog ponad kulturami* describe different innovations and retain distinct source IDs.
- `pages[].page` uses the original PDF page number. Source citations can append `#page=N` to the document URL. `pdfs[].text` is the complete extraction; `pages` preserves page-level provenance.
- Link and original file retention does not override the original reuse terms. The catalog preserves Creative Commons links and the library's linked licensing PDFs where present.

For the lonely older-person example, *Senior CUDER* explicitly addresses senior relationships and social activity. The map's senior priorities are on page 41 and its persona of a lonely widowed older woman on page 42. A recommendation still needs to distinguish a usable activity/model from a currently operating service.

## Reproduce the snapshot

The scraper is an administrative task, never application request handling. It needs Python 3, Beautiful Soup 4, and Poppler's `pdftotext` executable:

```sh
python3 -m venv /tmp/rops-scraper
/tmp/rops-scraper/bin/pip install beautifulsoup4
/tmp/rops-scraper/bin/python scripts/scrape-rops.py
```

Existing PDF downloads are reused. The scraper extracts page descriptions and links from the ROPS library, downloads each distinct PDF once, validates the PDF signature, computes hashes, extracts text, and records any download failures explicitly. Running it is an intentional new snapshot and updates `snapshotAt`.
