"""
Batch parse all scripts in scripts/metadata/analysis_corpus.json.

Pipeline:
  1. Clean each script (remove page numbers, scene numbers, (continued), etc.)
  2. Write cleaned text to scripts/filtered/scriptslug/
  3. Run the parser -> scripts/parsed/{tagged,dialogue,charinfo}/
  4. Save results to scripts/metadata/corpus_parsed_meta.json
"""

import json
import os
import re
import tempfile
from os.path import join, exists, isfile
from tqdm import tqdm

from parse_files import parse

# ── Paths ────────────────────────────────────────────────────────────────────
UNPROC_DIR   = join("scripts", "unprocessed", "scriptslug")
FILTERED_DIR = join("scripts", "filtered", "scriptslug")
PARSED_DIR   = join("scripts", "parsed")
META_FILE    = join("scripts", "metadata", "analysis_corpus.json")
OUT_META     = join("scripts", "metadata", "corpus_parsed_meta.json")

for d in [FILTERED_DIR,
          join(PARSED_DIR, "tagged"),
          join(PARSED_DIR, "dialogue"),
          join(PARSED_DIR, "charinfo")]:
    os.makedirs(d, exist_ok=True)

# ── Cleaning (mirrors clean_files.py) ────────────────────────────────────────
_scenenumber     = re.compile(r"^\d+\s+.*\s+\d+$")
_pagenumber      = re.compile(
    r"^[(]?\d{1,3}[)]?[\.]?$"
    r"|^.[(]?\d{1,3}[)]?[\.]?$"
    r"|^[(]?\d{1,3}[)]?.?[(]?\d{1,3}[)]?[\.]?$"
)
_cont            = re.compile(r"^\(continued\)$|^continued:$|^continued: \(\d+\)$")
_allspecialchars = re.compile(r"^[^\w\s ]*$")


def clean_script(text):
    text = text.encode("utf-8", "ignore").decode("utf-8").strip()
    text = text.replace("\f", "").replace("•", "").replace("·", "")
    lines = []
    for line in text.split("\n"):
        copy = line
        line = line.lower().strip()
        if len(line) == 1 and line not in {"a", "i"}:
            continue
        if _pagenumber.match(line):
            continue
        if _cont.match(line):
            continue
        if line != "" and _allspecialchars.match(line):
            continue
        if _scenenumber.match(line):
            numbers = copy.split()
            if numbers[0] == numbers[-1]:
                copy = " ".join(numbers[1:-1]).strip()
                line = copy.lower().strip()
        if _cont.match(line):
            continue
        if line == "omitted":
            continue
        lines.append(copy.strip())
    return re.sub(r"\n\n+", "\n\n", "\n".join(lines)).strip()


# ── Main ─────────────────────────────────────────────────────────────────────
with open(META_FILE) as f:
    corpus = json.load(f)

results = []
errors  = []

for entry in tqdm(corpus, desc="Parsing corpus"):
    slug     = entry["slug"]
    filename = entry["file"]          # e.g. "airplane-1980.txt"
    stem     = filename[:-4]           # e.g. "airplane-1980"

    src_path     = join(UNPROC_DIR, filename)
    cleaned_path = join(FILTERED_DIR, filename)

    # ── 1. Clean ──────────────────────────────────────────────────────────
    try:
        with open(src_path, "r", errors="ignore") as f:
            raw = f.read()
        cleaned = clean_script(raw)
        if not cleaned:
            errors.append({"slug": slug, "error": "empty after cleaning"})
            continue
        with open(cleaned_path, "w", encoding="utf-8") as f:
            f.write(cleaned)
    except Exception as e:
        errors.append({"slug": slug, "error": f"clean error: {e}"})
        continue

    # ── 2. Parse ──────────────────────────────────────────────────────────
    tagged_name   = stem + "_parsed.txt"
    dialogue_name = stem + "_dialogue.txt"
    charinfo_name = stem + "_charinfo.txt"

    try:
        parse(
            file_orig     = cleaned_path,
            save_dir      = PARSED_DIR,
            abr_flag      = "on",
            tag_flag      = "off",
            char_flag     = "on",
            off_flag      = "off",
            save_name     = tagged_name,
            abridged_name = dialogue_name,
            tag_name      = None,
            charinfo_name = charinfo_name,
        )
        results.append({
            **entry,
            "parsed": {
                "tagged":   tagged_name,
                "dialogue": dialogue_name,
                "charinfo": charinfo_name,
            }
        })
    except Exception as e:
        errors.append({"slug": slug, "error": f"parse error: {e}"})

# ── Save metadata ─────────────────────────────────────────────────────────────
with open(OUT_META, "w") as f:
    json.dump({"parsed": results, "errors": errors}, f, indent=2)

print(f"\nDone: {len(results)} parsed, {len(errors)} errors")
print(f"Metadata saved to {OUT_META}")
