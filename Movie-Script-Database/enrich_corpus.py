"""
Enrich analysis_corpus.json with TMDb metadata.

For each script, fetches:
  - genres, runtime, tagline, overview, original_language
  - vote_average, vote_count, popularity
  - budget, revenue
  - director(s), top 5 cast members

Writes results to scripts/metadata/analysis_corpus_enriched.json.
Already-enriched entries are skipped on re-runs (resume-safe).
"""

import json
import time
import urllib.request
import urllib.parse
from os.path import join

try:
    import config
    TMDB_KEY = config.tmdb_api_key
except Exception:
    raise SystemExit("No TMDb API key found in config.py")

SEARCH_URL  = "https://api.themoviedb.org/3/search/movie?api_key=%s&query=%s&year=%s&language=en-US&page=1"
DETAIL_URL  = "https://api.themoviedb.org/3/movie/%s?api_key=%s&language=en-US"
CREDITS_URL = "https://api.themoviedb.org/3/movie/%s/credits?api_key=%s"

IN_FILE  = join("scripts", "metadata", "analysis_corpus.json")
OUT_FILE = join("scripts", "metadata", "analysis_corpus_enriched.json")


def tmdb_get(url):
    try:
        with urllib.request.urlopen(url, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  request error: {e}")
        return None


def search_movie(title, year):
    url = SEARCH_URL % (TMDB_KEY, urllib.parse.quote(title), year)
    data = tmdb_get(url)
    if data and data.get("total_results", 0) > 0:
        return data["results"][0]
    # retry without year constraint
    url = SEARCH_URL % (TMDB_KEY, urllib.parse.quote(title), "")
    data = tmdb_get(url)
    if data and data.get("total_results", 0) > 0:
        return data["results"][0]
    return None


def get_details(tmdb_id):
    url = DETAIL_URL % (tmdb_id, TMDB_KEY)
    return tmdb_get(url)


def get_credits(tmdb_id):
    url = CREDITS_URL % (tmdb_id, TMDB_KEY)
    return tmdb_get(url)


def build_tmdb_block(result, details, credits):
    genres = [g["name"] for g in (details.get("genres") or [])]
    cast   = [m["name"] for m in (credits.get("cast") or [])[:5]]
    directors = [
        m["name"] for m in (credits.get("crew") or [])
        if m.get("job") == "Director"
    ]
    return {
        "tmdb_id":            result.get("id"),
        "imdb_id":            details.get("imdb_id"),
        "overview":           details.get("overview") or result.get("overview", ""),
        "tagline":            details.get("tagline", ""),
        "genres":             genres,
        "runtime":            details.get("runtime"),
        "original_language":  details.get("original_language"),
        "vote_average":       details.get("vote_average"),
        "vote_count":         details.get("vote_count"),
        "popularity":         result.get("popularity"),
        "budget":             details.get("budget"),
        "revenue":            details.get("revenue"),
        "directors":          directors,
        "cast":               cast,
    }


# ── Load corpus and any existing enriched data ────────────────────────────────
with open(IN_FILE) as f:
    corpus = json.load(f)

try:
    with open(OUT_FILE) as f:
        enriched = json.load(f)
    done_slugs = {e["slug"] for e in enriched}
    print(f"Resuming — {len(done_slugs)} already enriched")
except FileNotFoundError:
    enriched   = []
    done_slugs = set()

# ── Enrich ────────────────────────────────────────────────────────────────────
errors = []

for i, entry in enumerate(corpus):
    slug = entry["slug"]
    if slug in done_slugs:
        continue

    result = search_movie(entry["title"], entry["year"])
    if result is None:
        print(f"  [miss] {slug}")
        enriched.append({**entry, "tmdb": None})
        errors.append(slug)
    else:
        tmdb_id  = result["id"]
        details  = get_details(tmdb_id)  or {}
        credits  = get_credits(tmdb_id)  or {}
        enriched.append({**entry, "tmdb": build_tmdb_block(result, details, credits)})

    # save every 50 entries so progress isn't lost
    if (i + 1) % 50 == 0:
        with open(OUT_FILE, "w") as f:
            json.dump(enriched, f, indent=2)
        print(f"  saved checkpoint ({i+1}/{len(corpus)})")

    time.sleep(0.05)   # ~20 req/s — well within TMDb's 50 req/s limit

# ── Final save ────────────────────────────────────────────────────────────────
with open(OUT_FILE, "w") as f:
    json.dump(enriched, f, indent=2)

hit  = sum(1 for e in enriched if e.get("tmdb") is not None)
miss = sum(1 for e in enriched if e.get("tmdb") is None)
print(f"\nDone: {hit} enriched, {miss} misses")
print(f"Saved to {OUT_FILE}")
if errors:
    print("Misses:", errors[:10], "..." if len(errors) > 10 else "")
