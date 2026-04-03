import json
import re
import string
import urllib
import urllib.request
from os import listdir
from os.path import exists, getsize, isfile, join

import imdb
from fuzzywuzzy import fuzz
from tqdm.std import tqdm
from unidecode import unidecode


META_DIR = join("scripts", "metadata")
TMDB_MOVIE_URL = "https://api.themoviedb.org/3/search/movie?api_key=%s&language=en-US&query=%s&page=1"
TMDB_TV_URL = "https://api.themoviedb.org/3/search/tv?api_key=%s&language=en-US&query=%s&page=1"
TMDB_ID_URL = "https://api.themoviedb.org/3/find/%s?api_key=%s&language=en-US&external_source=imdb_id"

forbidden = ["the", "a", "an", "and", "or", "part", "vol", "chapter", "movie", "transcript"]

ia = imdb.IMDb()


def load_tmdb_api_key():
    try:
        import config
    except ModuleNotFoundError:
        return None
    return getattr(config, "tmdb_api_key", None)


def load_sources():
    with open("sources.json", "r") as f:
        return json.load(f)


def clean_name(name):
    name = name.lower()
    name = " ".join(name.split("_"))
    name = name.replace(", the", "")
    name = name.replace(", a", "")
    name = re.sub(" +", " ", name).strip()

    alt_name = name.split("filmed as")
    if len(alt_name) > 1:
        name = re.sub(r"[\([{})\]]", "", name).split("filmed as")[-1].strip()
    alt_name = name.split("released as")
    if len(alt_name) > 1:
        name = re.sub(r"[\([{})\]]", "", name).split("released as")[-1].strip()

    name = re.sub(r"\([^)]*\)", "", name)
    name = name.replace("early pilot", "")
    name = name.replace("final pilot", "")
    name = name.replace("transcript", "")
    name = name.replace("first draft", "")
    name = name.replace("tv script pdf", "")
    name = name.replace("pilot", "")
    name = name.strip()
    return name


def average_ratio(n, m):
    return ((fuzz.token_sort_ratio(n, m) + fuzz.token_sort_ratio(m, n)) // 2)


def roman_to_int(num):
    parts = num.split()
    res = []
    for s in parts:
        if s == "ii":
            res.append("2")
        elif s == "iii":
            res.append("3")
        elif s == "iv":
            res.append("4")
        elif s == "v":
            res.append("5")
        elif s == "vi":
            res.append("6")
        elif s == "vii":
            res.append("7")
        elif s == "viii":
            res.append("8")
        elif s == "ix":
            res.append("9")
        else:
            res.append(s)
    return " ".join(res)


def extra_clean(name):
    name = roman_to_int(clean_name(name))
    return name.replace("the ", "").replace("-", "").replace(":", "").replace("episode", "").replace(".", "")


def get_tmdb(name, tmdb_api_key, media_type="movie"):
    if not tmdb_api_key:
        return {}

    if media_type == "movie":
        base_url = TMDB_MOVIE_URL
        date = "release_date"
        title = "title"
    else:
        base_url = TMDB_TV_URL
        date = "first_air_date"
        title = "name"

    url = base_url % (tmdb_api_key, urllib.parse.quote(name))
    response = urllib.request.urlopen(url)
    jres = json.loads(response.read())

    if jres["total_results"] <= 0:
        return {}

    movie = jres["results"][0]
    if title in movie and date in movie and "id" in movie and "overview" in movie:
        return {
            "title": unidecode(movie[title]),
            "release_date": movie[date],
            "id": movie["id"],
            "overview": unidecode(movie["overview"]),
        }
    return {}


def get_tmdb_from_id(imdb_id, tmdb_api_key):
    if not tmdb_api_key:
        return {}

    url = TMDB_ID_URL % (imdb_id, tmdb_api_key)
    response = urllib.request.urlopen(url)
    jres = json.loads(response.read())

    if len(jres["movie_results"]) > 0:
        results = "movie_results"
        date = "release_date"
        title = "title"
    elif len(jres["tv_results"]) > 0:
        results = "tv_results"
        date = "first_air_date"
        title = "name"
    else:
        return {}

    movie = jres[results][0]
    if title in movie and date in movie and "id" in movie and "overview" in movie:
        return {
            "title": unidecode(movie[title]),
            "release_date": movie[date],
            "id": movie["id"],
            "overview": unidecode(movie["overview"]),
        }
    return {}


def get_imdb(name):
    try:
        movies = ia.search_movie(name)
        if len(movies) == 0:
            return {}

        movie = movies[0]
        if "year" not in movie:
            return {}

        return {
            "title": unidecode(movie["title"]),
            "release_date": movie["year"],
            "id": movie.movieID,
        }
    except Exception as err:
        print(err)
        return {}


def build_origin_metadata(sources_data):
    metadata = {}
    for source, included in sources_data.items():
        meta_file = join(META_DIR, source + ".json")
        if included == "true" and isfile(meta_file):
            with open(meta_file, "r") as json_file:
                metadata[source] = json.load(json_file)

    origin = {}
    unique = []

    for source, source_meta in metadata.items():
        source_dir = join("scripts", "unprocessed", source)
        files = [
            join(source_dir, f)
            for f in listdir(source_dir)
            if isfile(join(source_dir, f)) and getsize(join(source_dir, f)) > 3000
        ]

        for script in source_meta:
            name = re.sub(r"\([^)]*\)", "", script.strip()).lower()
            name = " ".join(name.split("-"))
            name = re.sub(r"[" + string.punctuation + "]", " ", name)
            name = re.sub(" +", " ", name).strip()
            name = " ".join([part for part in name.split() if part not in forbidden])
            name = roman_to_int("".join(name.split()))
            name = unidecode(name)
            unique.append(name)

            if name not in origin:
                origin[name] = {"files": []}

            curr_script = metadata[source][script]
            curr_file = join("scripts", "unprocessed", source, curr_script["file_name"] + ".txt")
            if curr_file in files:
                origin[name]["files"].append(
                    {
                        "name": unidecode(script),
                        "source": source,
                        "file_name": curr_script["file_name"],
                        "script_url": curr_script["script_url"],
                        "size": getsize(curr_file),
                    }
                )
            elif name in origin:
                origin.pop(name, None)

    final = sorted(list(set(unique)))
    print("Unique normalized titles:", len(final))
    return origin


def enrich_with_tmdb(origin, tmdb_api_key):
    if not tmdb_api_key:
        print("No TMDb API key found. Skipping TMDb enrichment.")
        return

    print("Get metadata from TMDb")
    count = 0
    for script in tqdm(origin):
        name = origin[script]["files"][0]["name"]
        movie_data = get_tmdb(name, tmdb_api_key)

        if not movie_data:
            name = extra_clean(name)
            movie_data = get_tmdb(name, tmdb_api_key)

        if not movie_data:
            movie_data = get_tmdb(name, tmdb_api_key, "tv")

        if movie_data:
            origin[script]["tmdb"] = movie_data
        else:
            print(name)
            count += 1

    print("TMDb misses:", count)


def enrich_with_imdb(origin):
    print("Get metadata from IMDb")
    count = 0
    for script in tqdm(origin):
        name = origin[script]["files"][0]["name"]
        movie_data = get_imdb(name)

        if not movie_data:
            name = extra_clean(name)
            movie_data = get_imdb(name)

        if movie_data:
            origin[script]["imdb"] = movie_data
        else:
            print(name)
            count += 1

    print("IMDb misses:", count)


def backfill_tmdb_from_imdb(origin, tmdb_api_key):
    if not tmdb_api_key:
        return

    print("Use IMDb id to search TMDb")
    count = 0
    for script in tqdm(origin):
        if "imdb" in origin[script] and "tmdb" not in origin[script]:
            imdb_id = "tt" + origin[script]["imdb"]["id"]
            movie_data = get_tmdb_from_id(imdb_id, tmdb_api_key)
            if movie_data:
                origin[script]["tmdb"] = movie_data
            else:
                print(origin[script]["imdb"]["title"], imdb_id)
                count += 1
    print("TMDb backfill misses:", count)


def reconcile_imdb_tmdb(origin, tmdb_api_key):
    if not tmdb_api_key:
        return

    print("Identify and correct names")
    count = 0
    for script in tqdm(origin):
        if "imdb" not in origin[script] or "tmdb" not in origin[script]:
            continue

        imdb_name = extra_clean(unidecode(origin[script]["imdb"]["title"]))
        tmdb_name = extra_clean(unidecode(origin[script]["tmdb"]["title"]))
        file_name = extra_clean(origin[script]["files"][0]["name"])

        if imdb_name != tmdb_name and average_ratio(file_name, tmdb_name) < 85 and average_ratio(file_name, imdb_name) > 85:
            imdb_id = "tt" + origin[script]["imdb"]["id"]
            movie_data = get_tmdb_from_id(imdb_id, tmdb_api_key)
            if movie_data:
                origin[script]["tmdb"] = movie_data
            else:
                print(origin[script]["imdb"]["title"], imdb_id)
                count += 1

        if imdb_name != tmdb_name and average_ratio(file_name, tmdb_name) > 85 and average_ratio(file_name, imdb_name) < 85:
            name = origin[script]["tmdb"]["title"]
            movie_data = get_imdb(name) or get_imdb(extra_clean(name))
            if movie_data:
                origin[script]["imdb"] = movie_data
            else:
                print(name)
                count += 1

    print("Reconciliation misses:", count)


def main():
    if not exists(META_DIR):
        raise FileNotFoundError("scripts/metadata does not exist yet")

    sources_data = load_sources()
    tmdb_api_key = load_tmdb_api_key()

    origin = build_origin_metadata(sources_data)
    enrich_with_tmdb(origin, tmdb_api_key)
    enrich_with_imdb(origin)
    backfill_tmdb_from_imdb(origin, tmdb_api_key)

    with open(join(META_DIR, "clean_meta.json"), "w") as outfile:
        json.dump(origin, outfile, indent=4)

    reconcile_imdb_tmdb(origin, tmdb_api_key)

    with open(join(META_DIR, "clean_meta.json"), "w") as outfile:
        json.dump(origin, outfile, indent=4)


if __name__ == "__main__":
    main()
