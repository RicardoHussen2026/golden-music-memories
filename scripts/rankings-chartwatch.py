"""Extract only CIN/OCC positions 1-30 from the five preserved Chartwatch PDFs.

Read-only with respect to catalog and original staging. Requires pdfplumber.
Outputs a supplementary staging file, not an import plan. No network operations.
"""
import argparse
import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import pdfplumber

PAGES = {2000: 41, 2001: 37, 2002: 44, 2003: 43, 2004: 45}
SENTINELS = {2000: "Bob The Builder", 2001: "Shaggy", 2002: "Will Young",
             2003: "Black Eyed Peas", 2004: "Band Aid 20"}
TEXT_CORRECTIONS = {
    (2002, 8, "title"): ("AserejØ (The Ketchup Song)", "Aserejé (The Ketchup Song)"),
    (2003, 15, "artist"): ("BeyoncØ", "Beyoncé"),
}


def normalize_credit(value):
    # PDF font ligatures and typographic punctuation only. Never strip versions,
    # featured credits, stars, EPs or compound singles by fuzzy matching.
    for cid, text in {27: "ff", 28: "fi", 29: "fl", 30: "ffi", 31: "ffl", 214: "Ö"}.items():
        value = value.replace(f"(cid:{cid})", text)
    value = value.replace("’", "'").replace("‘", "'").replace("…", "...")
    if "(cid:" in value or "\ufffd" in value:
        raise ValueError(f"Unresolved font mapping: {value}")
    return value.strip()


def parse_row(line):
    """Identify the final label/statistics block before splitting the last dash.

    A font CID in an artist is not a label. An internal title dash is not the
    title/artist boundary. Preserve the unmodified row for independent review.
    """
    match = re.match(r"^(\d+)\s+(\d+)\s+(\d+)\s+(.+)$", line)
    if not match:
        return None
    credit = re.match(r"^(.+\))\s+(\d+(?:\s+[\d,.]+)+(?:W)?)$", match[4])
    if not credit:
        raise ValueError(f"Unrecognized complete row: {line}")
    depth, label_start = 0, None
    for index in range(len(credit[1]) - 1, -1, -1):
        if credit[1][index] == ")":
            depth += 1
        elif credit[1][index] == "(":
            depth -= 1
            if depth == 0:
                label_start = index
                break
    if label_start is None:
        raise ValueError(f"Unbalanced final label: {line}")
    full_credit = credit[1][:label_start].strip()
    if " (cid:21) " not in full_credit:
        raise ValueError(f"Missing title/artist boundary: {line}")
    title, artist = full_credit.rsplit(" (cid:21) ", 1)
    return {"official": int(match[1]), "cw": int(match[2]), "pos": int(match[3]),
            "raw_title": title, "raw_artist": artist,
            "title": normalize_credit(title.replace("(cid:21)", "–")),
            "artist": normalize_credit(artist)}


def extract_list(path, year, checked_at):
    page_number = PAGES[year]
    with pdfplumber.open(path) as pdf:
        text = pdf.pages[page_number - 1].extract_text(x_tolerance=1, y_tolerance=2)
    assert re.search(r"3\.2\s+The Top \d+ Singles of " + str(year), text)
    column = "OCC" if year == 2004 else "CIN"
    assert re.search(column + r"\s+CW\s+Pos", text)
    rows = []
    for line in text.splitlines():
        prefix = re.match(r"^(\d+)\s+(\d+)\s+(\d+)\s+", line)
        if not prefix or not 1 <= int(prefix[1]) <= 30:
            continue
        parsed = parse_row(line)
        notes = []
        for field in ["title", "artist"]:
            correction = TEXT_CORRECTIONS.get((year, parsed["official"], field))
            if correction:
                assert parsed[field] == correction[0], "Font mapping/source changed"
                parsed[field] = correction[1]
                notes.append({"field": field, "extracted": correction[0], "visible": correction[1],
                              "basis": "Accented glyph checked against table page image"})
        title, artist = parsed["title"], parsed["artist"]
        continued = title.startswith("*")
        rows.append({"position": parsed["official"], "title": title.lstrip("*"),
                     "artist": artist, "releaseYear": None,
                     "sourceColumns": {column: parsed["official"], "CW": parsed["cw"], "Pos": parsed["pos"]},
                     "sourcePage": page_number, "sourceRowExtracted": line,
                     "sourceTitleExtracted": parsed["raw_title"], "sourceArtistExtracted": parsed["raw_artist"],
                     "normalizationNotes": notes,
                     "sourceRunContinues": continued,
                     "recordingIdentityStatus": "not_verified"})
    rows.sort(key=lambda row: row["position"])
    assert [row["position"] for row in rows] == list(range(1, 31)), (year, len(rows))
    assert SENTINELS[year] in rows[0]["artist"], (year, rows[0])
    return {"id": f"chartwatch-gb-annual-{year}", "kind": "annual", "chartYear": year,
            "market": "GB", "publisher": "CHARTWATCH / Tobias Zywietz",
            "sourceUrl": f"https://www.zobbel.de/cluk/CLUK{year}.pdf",
            "accessedAt": checked_at, "accessDateMeaning": "PDF checked against accessible publisher source this round; original cache acquisition time not asserted",
            "sourceSha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "requestedSize": 30, "sourcePage": page_number,
            "sourceTier": "secondary_reproduction_of_official_positions",
            "officialColumn": column,
            "edition": "Contemporary annual booklet, physical singles; official CIN/OCC order reproduced by secondary source",
            "methodology": "UK annual singles sales ranking: positions from the first CIN/OCC column reproduced in Chartwatch section3.2; not CW/Pos points, not worldwide, not release year. Secondary source of official positions.",
            "sourceCaveats": (["Introduction says 2003 chart year and contains inconsistent dates; cover, section3.2, official column and listed singles identify 2004. Original text retained; do not silently correct."] if year == 2004 else []),
            "rows": rows}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cache", default=".cache/chartwatch")
    parser.add_argument("--output", default="research/rankings/staging/chartwatch-2000-2004.json")
    parser.add_argument("--review-manifest", default="research/rankings/chartwatch-review.json")
    args = parser.parse_args()
    now = datetime.now(timezone.utc).isoformat()
    lists = [extract_list(Path(args.cache) / f"CLUK{year}.pdf", year, now) for year in PAGES]
    data = {"schemaVersion": 1, "generatedAt": now,
            "scope": {"annualFrom": 1960, "annualThrough": 2009, "annualSize": 30,
                      "allTimeSize": 100, "market": "GB", "status": "staging_not_imported"},
            "lists": lists, "gaps": [], "operationalImport": False,
            "validationStatus": "extraction_corrected_awaiting_review",
            "review": "Font CIDs and internal title separator corrected; original transcriptions retained. Complete review and validation required before counting; no operational import."}
    review_path = Path(args.review_manifest)
    if review_path.exists():
        review = json.loads(review_path.read_text(encoding="utf-8"))
        for source in lists:
            proof = next(r for r in review["lists"] if r["chartYear"] == source["chartYear"])
            credits = "\n".join(f'{r["position"]}\t{r["title"]}\t{r["artist"]}' for r in source["rows"]) + "\n"
            assert proof["sourceSha256"] == source["sourceSha256"]
            assert proof["creditSha256"] == hashlib.sha256(credits.encode("utf-8")).hexdigest()
            assert proof["reviewedPositions"] == list(range(1, 31))
            assert proof["sourcePage"] == source["sourcePage"]
            source["sourceReview"] = {"status": "all_30_positions_visually_checked",
                                      "checkedAt": review["checkedAt"], "reviewer": review["reviewer"]}
        data["validationStatus"] = "reviewed_source_facts_only_recordings_unverified"
        data["reviewManifestSha256"] = hashlib.sha256(review_path.read_bytes()).hexdigest()
        data["review"] = "150 positions/credits checked against five table images; original transcription and normalizations preserved. Recording identities, release years and catalog imports remain unverified."
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(output), "positions": sum(len(x["rows"]) for x in lists)}))


if __name__ == "__main__":
    main()
