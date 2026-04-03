import itertools
import json
import re
from os import makedirs
from os.path import exists, isfile, join

from tqdm import tqdm


SCRIPT_DIR = join("scripts", "unprocessed")
META_DIR = join("scripts", "metadata")
CLEAN_DIR = join("scripts", "filtered")
META_FILE = join(META_DIR, "clean_meta.json")
CLEAN_META = join(META_DIR, "clean_files_meta.json")

makedirs(CLEAN_DIR, exist_ok=True)


if not exists(META_FILE):
    raise FileNotFoundError("scripts/metadata/clean_meta.json does not exist. Run get_metadata.py first.")

with open(META_FILE, "r") as f:
    metadata = json.load(f)


def clean_script(text):
    text = text.encode("utf-8", "ignore").decode("utf-8").strip()
    text = text.replace("\f", "")
    text = text.replace("•", "")
    text = text.replace("·", "")

    scenenumber = re.compile(r"^\d+\s+.*\s+\d+$")
    pagenumber = re.compile(r"^[(]?\d{1,3}[)]?[\.]?$|^.[(]?\d{1,3}[)]?[\.]?$|^[(]?\d{1,3}[)]?.?[(]?\d{1,3}[)]?[\.]?$")
    cont = re.compile(r"^\(continued\)$|^continued:$|^continued: \(\d+\)$")
    allspecialchars = re.compile(r"^[^\w\s ]*$")

    lines = []
    for line in text.split("\n"):
        copy = line
        line = line.lower().strip()

        if len(line) == 1 and line.lower() not in {"a", "i"}:
            continue
        if pagenumber.match(line):
            continue
        if cont.match(line):
            continue
        if line != "" and allspecialchars.match(line):
            continue
        if scenenumber.match(line):
            numbers = copy.split()
            if numbers[0] == numbers[-1]:
                copy = " ".join(numbers[1:-1]).strip()
                line = copy.lower().strip()
        if cont.match(line):
            continue
        if line == "omitted":
            continue
        lines.append(copy.strip())

    final_data = "\n".join(lines)
    final_data = re.sub(r"\n\n+", "\n\n", final_data).strip()
    return final_data


def compare_scripts(scripts):
    combos = list(itertools.combinations(scripts, 2))

    for combo in combos:
        if combo[0]["text"] == combo[1]["text"]:
            left = next((index for (index, d) in enumerate(scripts) if d["source"] == combo[0]["source"]), None)
            right = next((index for (index, d) in enumerate(scripts) if d["source"] == combo[1]["source"]), None)
            scripts[left]["matches"] += 1
            scripts[right]["matches"] += 1

    return sorted(scripts, key=lambda i: (i["matches"], i["size"]), reverse=True)[0]


def get_clean_text(path):
    with open(path, "r", errors="ignore") as f:
        text = f.read()
    return clean_script(text).strip()


clean_dict = {}

for script in tqdm(metadata):
    files = metadata[script]["files"]

    if len(files) == 1:
        path = join(SCRIPT_DIR, files[0]["source"], files[0]["file_name"] + ".txt")
        if not isfile(path):
            continue

        clean_text = get_clean_text(path)
        if clean_text == "":
            continue

        clean_dict[script] = {"file": files[0]}
    else:
        script_arr = []
        for file in files:
            path = join(SCRIPT_DIR, file["source"], file["file_name"] + ".txt")
            if not isfile(path):
                continue

            clean_text = get_clean_text(path)
            if clean_text == "":
                continue

            file_copy = dict(file)
            file_copy["text"] = clean_text[:10000]
            file_copy["matches"] = 0
            script_arr.append(file_copy)

        if not script_arr:
            continue

        final = compare_scripts(script_arr)
        final.pop("text", None)
        final.pop("matches", None)
        clean_dict[script] = {"file": final}

    if "tmdb" in metadata[script]:
        clean_dict[script]["tmdb"] = metadata[script]["tmdb"]
    if "imdb" in metadata[script]:
        clean_dict[script]["imdb"] = metadata[script]["imdb"]

    clean_dict[script]["file"].pop("size", None)

    path = join(SCRIPT_DIR, clean_dict[script]["file"]["source"], clean_dict[script]["file"]["file_name"] + ".txt")
    if not isfile(path):
        clean_dict.pop(script, None)
        continue

    clean_text = get_clean_text(path)
    with open(join(CLEAN_DIR, clean_dict[script]["file"]["file_name"] + ".txt"), "w", errors="ignore") as out:
        out.write(clean_text)


with open(CLEAN_META, "w") as outfile:
    json.dump(clean_dict, outfile, indent=4)


count = 0
score = {}
for script in clean_dict:
    if "tmdb" in clean_dict[script] and "imdb" in clean_dict[script]:
        count += 1
    source = clean_dict[script]["file"]["source"]
    score[source] = score.get(source, 0) + 1

print("Total scripts: ", len(clean_dict))
print("Scripts with complete metadata: ", count)
print("Source Breakdown: ", score)
