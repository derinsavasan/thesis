import json
import subprocess
import sys
import urllib.request
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE_DIR))

from sources import utilities


META_PATH = BASE_DIR / "scripts" / "metadata" / "scriptslug.json"
RAW_DIR = BASE_DIR / "scripts" / "unprocessed" / "scriptslug"
TEMP_DIR = BASE_DIR / "scripts" / "temp" / "scriptslug"
REPORT_PATH = BASE_DIR / "scripts" / "repair" / "scriptslug_recovery_report.json"

TARGET_SLUGS = [
    "get-low-2009",
    "reign-of-fire-2002",
]


def load_lookup():
    data = json.loads(META_PATH.read_text())
    return {
        value["file_name"]: {"title": title, **value}
        for title, value in data.items()
        if isinstance(value, dict) and value.get("file_name")
    }


def download_pdf(url: str, slug: str) -> Path:
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    pdf_path = TEMP_DIR / f"{slug}.recovery.pdf"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as response:
        pdf_path.write_bytes(response.read())
    return pdf_path


def run_pdftotext(pdf_path: Path, slug: str) -> str:
    txt_path = TEMP_DIR / f"{slug}.pdftotext.txt"
    try:
        subprocess.run(
            ["pdftotext", "-layout", str(pdf_path), str(txt_path)],
            check=True,
            timeout=120,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if txt_path.exists():
            return txt_path.read_text(errors="ignore").strip()
    except Exception:
        return ""
    return ""


def run_image_ocr(pdf_path: Path, slug: str) -> str:
    image_prefix = TEMP_DIR / f"{slug}.page"
    ocr_out_base = TEMP_DIR / f"{slug}.ocr"
    text_chunks = []

    try:
        subprocess.run(
            ["pdftoppm", "-r", "300", "-png", str(pdf_path), str(image_prefix)],
            check=True,
            timeout=300,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        return ""

    image_paths = sorted(TEMP_DIR.glob(f"{slug}.page-*.png"))
    for idx, image_path in enumerate(image_paths, start=1):
        page_base = TEMP_DIR / f"{slug}.ocr-page-{idx}"
        try:
            subprocess.run(
                ["tesseract", str(image_path), str(page_base), "--psm", "6"],
                check=True,
                timeout=120,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            txt_path = page_base.with_suffix(".txt")
            if txt_path.exists():
                text_chunks.append(txt_path.read_text(errors="ignore").strip())
        except Exception:
            continue

    return "\n\n".join(chunk for chunk in text_chunks if chunk).strip()


def better_text(current_text: str, candidate_text: str) -> bool:
    if not candidate_text:
        return False
    if not current_text:
        return True
    current_len = len(current_text)
    candidate_len = len(candidate_text)
    current_score = utilities.text_quality_score(current_text)
    candidate_score = utilities.text_quality_score(candidate_text)
    return candidate_len > current_len * 1.5 or (
        candidate_len > current_len and candidate_score <= current_score
    )


def main():
    lookup = load_lookup()
    report = []

    for slug in TARGET_SLUGS:
        meta = lookup.get(slug)
        txt_path = RAW_DIR / f"{slug}.txt"
        current_text = txt_path.read_text(errors="ignore") if txt_path.exists() else ""

        entry = {
            "slug": slug,
            "title": meta["title"] if meta else "",
            "old_size": len(current_text),
            "status": "skipped",
        }

        if not meta:
            entry["status"] = "missing_metadata"
            report.append(entry)
            continue

        pdf_path = download_pdf(meta["script_url"], slug)
        pdftotext_text = run_pdftotext(pdf_path, slug)
        image_ocr_text = ""

        best_text = pdftotext_text
        best_method = "pdftotext"

        if not better_text(current_text, best_text):
            image_ocr_text = run_image_ocr(pdf_path, slug)
            if len(image_ocr_text) > len(best_text):
                best_text = image_ocr_text
                best_method = "image_ocr"

        entry["pdftotext_size"] = len(pdftotext_text)
        entry["image_ocr_size"] = len(image_ocr_text)
        entry["best_method"] = best_method
        entry["new_size"] = len(best_text)

        if better_text(current_text, best_text):
            txt_path.write_text(best_text, errors="ignore")
            entry["status"] = "replaced"
        else:
            entry["status"] = "kept_existing"

        print(f"{slug}: {entry['status']} ({entry['old_size']} -> {entry['new_size']}) via {best_method}")
        report.append(entry)

    REPORT_PATH.write_text(json.dumps(report, indent=4))
    print(f"\nWrote report to {REPORT_PATH}")


if __name__ == "__main__":
    main()
