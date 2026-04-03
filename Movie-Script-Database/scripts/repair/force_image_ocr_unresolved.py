import json
import subprocess
import sys
import urllib.request
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE_DIR))


META_PATH = BASE_DIR / "scripts" / "metadata" / "scriptslug.json"
RAW_DIR = BASE_DIR / "scripts" / "unprocessed" / "scriptslug"
TEMP_DIR = BASE_DIR / "scripts" / "temp" / "scriptslug"
REPORT_PATH = BASE_DIR / "scripts" / "repair" / "scriptslug_force_image_ocr_report.json"

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
    pdf_path = TEMP_DIR / f"{slug}.force-ocr.pdf"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as response:
        pdf_path.write_bytes(response.read())
    return pdf_path


def image_ocr(pdf_path: Path, slug: str) -> str:
    image_prefix = TEMP_DIR / f"{slug}.force-page"
    text_chunks = []

    subprocess.run(
        ["pdftoppm", "-r", "300", "-png", str(pdf_path), str(image_prefix)],
        check=True,
        timeout=600,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    image_paths = sorted(TEMP_DIR.glob(f"{slug}.force-page-*.png"))
    for idx, image_path in enumerate(image_paths, start=1):
        page_base = TEMP_DIR / f"{slug}.force-ocr-page-{idx}"
        try:
            subprocess.run(
                ["tesseract", str(image_path), str(page_base), "--psm", "6"],
                check=True,
                timeout=180,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            txt_path = page_base.with_suffix(".txt")
            if txt_path.exists():
                text = txt_path.read_text(errors="ignore").strip()
                if text:
                    text_chunks.append(text)
        except Exception:
            continue

    return "\n\n".join(text_chunks).strip()


def better(candidate: str, current: str) -> bool:
    return len(candidate or "") > len(current or "")


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
        try:
            ocr_text = image_ocr(pdf_path, slug)
        except Exception as err:
            entry["status"] = "ocr_failed"
            entry["error"] = str(err)
            entry["new_size"] = 0
            report.append(entry)
            print(f"{slug}: ocr_failed")
            continue

        entry["new_size"] = len(ocr_text)
        if better(ocr_text, current_text):
            txt_path.write_text(ocr_text, errors="ignore")
            entry["status"] = "replaced"
        else:
            entry["status"] = "kept_existing"

        print(f"{slug}: {entry['status']} ({entry['old_size']} -> {entry['new_size']})")
        report.append(entry)

    REPORT_PATH.write_text(json.dumps(report, indent=4))
    print(f"\nWrote report to {REPORT_PATH}")


if __name__ == "__main__":
    main()
