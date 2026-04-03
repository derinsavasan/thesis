import json
import os
import time

import sources


DIR = os.path.join("scripts", "temp")


def main():
    os.makedirs(DIR, exist_ok=True)

    with open("sources.json", "r") as f:
        data = json.load(f)

    starttime = time.time()

    for source, included in data.items():
        if included != "true":
            continue
        print(f"Fetching {source}...")
        sources.get_scripts(source)

    print()
    print("Time taken = {} seconds".format(time.time() - starttime))


if __name__ == "__main__":
    main()
