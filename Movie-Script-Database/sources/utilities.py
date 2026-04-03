from bs4 import BeautifulSoup
import subprocess
import urllib.request
import string
import os
import re


HTTP_TIMEOUT_SECONDS = 30
OCR_TIMEOUT_SECONDS = 180


def format_filename(s):
    valid_chars = "-() %s%s%s" % (string.ascii_letters, string.digits, "%")
    filename = ''.join(c for c in s if c in valid_chars)
    filename = filename.replace('%20', ' ')
    filename = filename.replace('%27', '')
    filename = filename.replace(' ', '-')
    filename = re.sub(r'-+', '-', filename).strip()
    return filename


def get_soup(url):
    try:
        page = urllib.request.Request(
            url, headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64)'})
        result = urllib.request.urlopen(page, timeout=HTTP_TIMEOUT_SECONDS)
        resulttext = result.read()

        soup = BeautifulSoup(resulttext, 'html.parser')

    except Exception as err:
        print(err)
        soup = None
    return soup


def text_quality_score(text):
    if not text:
        return 0.0

    length = max(len(text), 1)
    replacement = text.count("\ufffd")
    bullets = text.count("•") + text.count("·")
    non_ascii = len(re.findall(r"[^\x00-\x7F]", text))
    repeated_dots = len(re.findall(r"\.\.\.[A-Za-z]{0,4}", text))

    penalty = replacement + bullets + non_ascii + (repeated_dots * 3)
    return penalty / length


def should_force_ocr(text):
    if not text or len(text) < 500:
        return True

    score = text_quality_score(text)
    return score > 0.01


def get_pdf_text(url, name):
    from pypdf import PdfReader
    doc = os.path.join("scripts", "temp", name + ".pdf")
    try:
        result = urllib.request.urlopen(url, timeout=HTTP_TIMEOUT_SECONDS)
        with open(doc, 'wb') as f:
            f.write(result.read())
    except Exception as err:
        print(err)
        return ""
    try:
        reader = PdfReader(doc)
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")
        text = "\n".join(pages).strip()
    except Exception as err:
        print(err)
        text = ""

    # Fall back to OCR when the embedded text layer is missing or clearly noisy.
    if should_force_ocr(text):
        ocr_doc = os.path.join("scripts", "temp", name + ".ocr.pdf")
        sidecar = os.path.join("scripts", "temp", name + ".ocr.txt")
        try:
            subprocess.run(
                [
                    "ocrmypdf",
                    "--force-ocr",
                    "--sidecar",
                    sidecar,
                    doc,
                    ocr_doc,
                ],
                check=True,
                timeout=OCR_TIMEOUT_SECONDS,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            if os.path.isfile(sidecar):
                with open(sidecar, "r", errors="ignore") as f:
                    ocr_text = f.read().strip()
                if len(ocr_text) > 0:
                    current_score = text_quality_score(text)
                    ocr_score = text_quality_score(ocr_text)
                    if len(text) == 0 or ocr_score < current_score or len(ocr_text) > len(text):
                        text = ocr_text
        except Exception as err:
            print(err)
    return text


def get_doc_text(url, name):
    import textract
    doc = os.path.join("scripts", "temp", name + ".doc")
    result = urllib.request.urlopen(url)
    f = open(doc, 'wb')
    f.write(result.read())
    f.close()
    try:
        text = textract.process(doc, encoding='utf-8').decode('utf-8')
    except Exception as err:
        print(err)
        text = ""
    # if os.path.isfile(doc):
    #     os.remove(doc)
    return text


def create_script_dirs(source):
    DIR = os.path.join("scripts", "unprocessed", source)
    TEMP_DIR = os.path.join("scripts", "temp", source)
    META_DIR = os.path.join("scripts", "metadata")

    os.makedirs(DIR, exist_ok=True)
    os.makedirs(META_DIR, exist_ok=True)
    os.makedirs(TEMP_DIR, exist_ok=True)

    return DIR, TEMP_DIR, META_DIR
