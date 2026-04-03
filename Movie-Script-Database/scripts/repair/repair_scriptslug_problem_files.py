import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE_DIR))

from sources import utilities

META_PATH = BASE_DIR / "scripts" / "metadata" / "scriptslug.json"
RAW_DIR = BASE_DIR / "scripts" / "unprocessed" / "scriptslug"
REPAIR_LIST = BASE_DIR / "scripts" / "repair" / "scriptslug_problem_slugs.txt"
REPORT_PATH = BASE_DIR / "scripts" / "repair" / "scriptslug_repair_report.json"


def load_lookup():
    data = json.loads(META_PATH.read_text())
    return {
        value["file_name"]: {"title": title, **value}
        for title, value in data.items()
        if isinstance(value, dict) and value.get("file_name")
    }


def quality_tuple(text):
    return (
        len(text or ""),
        -(utilities.text_quality_score(text or "")),
    )


def should_replace(current_text, repaired_text):
    if not repaired_text:
        return False
    if not current_text:
        return True
    return quality_tuple(repaired_text) > quality_tuple(current_text)


def main():
    utilities.OCR_TIMEOUT_SECONDS = 600

    lookup = load_lookup()
    slugs = [line.strip() for line in REPAIR_LIST.read_text().splitlines() if line.strip()]
    report = []

    for slug in slugs:
        meta = lookup.get(slug)
        txt_path = RAW_DIR / f"{slug}.txt"
        current_text = txt_path.read_text(errors="ignore") if txt_path.exists() else ""

        entry = {
            "slug": slug,
            "title": meta["title"] if meta else "",
            "had_metadata": bool(meta),
            "old_size": len(current_text),
            "status": "skipped",
        }

        if not meta:
            entry["status"] = "missing_metadata"
            report.append(entry)
            continue

        repaired_text = utilities.get_pdf_text(meta["script_url"], f"scriptslug/{slug}")
        entry["new_size"] = len(repaired_text)

        if should_replace(current_text, repaired_text):
            txt_path.write_text(repaired_text, errors="ignore")
            entry["status"] = "replaced"
        elif repaired_text:
            entry["status"] = "kept_existing"
        else:
            entry["status"] = "repair_failed"

        report.append(entry)
        print(f"{slug}: {entry['status']} ({entry['old_size']} -> {entry.get('new_size', 0)})")

    REPORT_PATH.write_text(json.dumps(report, indent=4))
    print(f"\nWrote report to {REPORT_PATH}")


if __name__ == "__main__":
    main()
