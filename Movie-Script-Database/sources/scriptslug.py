from bs4 import BeautifulSoup

import json
import os
import re

from tqdm import tqdm

from .utilities import format_filename, get_soup, get_pdf_text, create_script_dirs


def get_scriptslug():
    SITEMAP_URL = "https://www.scriptslug.com/sitemap-scripts.xml"
    SOURCE = "scriptslug"
    DIR, TEMP_DIR, META_DIR = create_script_dirs(SOURCE)
    META_PATH = os.path.join(META_DIR, SOURCE + ".json")

    def save_metadata(data):
        with open(META_PATH, "w") as outfile:
            json.dump(data, outfile, indent=4)

    def get_script_from_page(page_url):
        soup = get_soup(page_url)
        if soup is None:
            return None

        format_links = [
            a.get("href", "") for a in soup.find_all("a", href=True)
            if "/scripts/format/" in a.get("href", "")
        ]
        if "/scripts/format/film" not in format_links:
            return None

        title = ""
        if soup.title:
            title = soup.title.get_text(strip=True).split(" - ")[0].strip()
        if not title and soup.find("h1"):
            title = soup.find("h1").get_text(" ", strip=True)

        pdf_url = ""
        for a in soup.find_all("a", href=True):
            href = a.get("href", "")
            if ".pdf" in href:
                pdf_url = href
                break

        if not title or not pdf_url:
            return None

        slug = page_url.rstrip("/").split("/")[-1]
        file_name = format_filename(slug)

        return {
            "title": title,
            "file_name": file_name,
            "script_url": pdf_url,
            "page_url": page_url,
        }

    files = [
        os.path.join(DIR, f)
        for f in os.listdir(DIR)
        if os.path.isfile(os.path.join(DIR, f)) and os.path.getsize(os.path.join(DIR, f)) > 3000
    ]

    sitemap_soup = get_soup(SITEMAP_URL)
    if sitemap_soup is None:
        return

    page_urls = [
        loc.get_text(strip=True)
        for loc in sitemap_soup.find_all("loc")
        if "/script/" in loc.get_text(strip=True)
    ]

    metadata = {}
    if os.path.isfile(META_PATH):
        try:
            with open(META_PATH, "r") as infile:
                metadata = json.load(infile)
        except Exception:
            metadata = {}

    for page_url in tqdm(page_urls, desc=SOURCE):
        script_info = get_script_from_page(page_url)
        if script_info is None:
            continue

        title = script_info["title"]
        file_name = script_info["file_name"]
        script_url = script_info["script_url"]

        metadata[title] = {
            "file_name": file_name,
            "script_url": script_url,
            "page_url": page_url,
        }

        if os.path.join(DIR, file_name + ".txt") in files:
            save_metadata(metadata)
            continue

        text = get_pdf_text(script_url, os.path.join(SOURCE, file_name))
        if text == "":
            metadata.pop(title, None)
            save_metadata(metadata)
            continue

        with open(os.path.join(DIR, file_name + ".txt"), "w", errors="ignore") as out:
            out.write(text)
        save_metadata(metadata)

    save_metadata(metadata)
