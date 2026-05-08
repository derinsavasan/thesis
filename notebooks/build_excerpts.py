#!/usr/bin/env python3
"""
build_excerpts.py — extract a small screenplay window around each turning
point so the explorer can show real source context (instead of a generic
"[note pending]") on hover for any film in the corpus.

Inputs
------
    docs/thesis-outputs/reversals.json
    Movie-Script-Database/scripts/filtered/scriptslug/{slug}.txt

Output
------
    docs/thesis-outputs/excerpts/{slug}.json
        { "slug": "...", "excerpts": [ { "position": 0.42, "excerpt": "..." }, ... ] }

The frontend (loadFilm in docs/main.js) lazily fetches the excerpt sidecar
for the currently-loaded film. If a curated NOTES entry exists for that
turning point it wins; otherwise the excerpt is shown.

Run from the repo root:
    python3 notebooks/build_excerpts.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SCRIPTS_DIR = REPO / "Movie-Script-Database" / "scripts" / "filtered" / "scriptslug"
REVERSALS_PATH = REPO / "docs" / "thesis-outputs" / "reversals.json"
OUTPUT_DIR = REPO / "docs" / "thesis-outputs" / "excerpts"

# Lines on each side of the focal line. Total window = 2*WINDOW + 1 lines.
# 12 gives 25 lines — roughly a full beat of screenplay (action paragraph
# + a couple of dialogue exchanges). The frontend caps the visible block
# height and lets the user scroll within it for the rest.
WINDOW = 12

# How far we'll drift the window edges inward to land on a clean
# boundary. MSDB filtered scripts often strip blank lines entirely, so
# we have to be willing to drift quite a bit (up to 10 lines) to find a
# CHARACTER cue, scene heading, or sentence-terminator break. Combined
# with WINDOW=12 (25-line raw window), even a max-drift on both edges
# leaves ~5 lines visible — plenty paired with the focal line itself.
EDGE_DRIFT = 10

# A line with a run of 26+ letters is almost certainly a PDF-extraction
# artifact (concatenated words like "YOUGOTPUNTYOFPEOPLnL") or a stylistic
# sound effect ("BRAKABRAKABRAKABRAKA") that reads as garbage to a casual
# viewer. We drop these lines from the excerpt rather than show them.
GARBAGE_RE = re.compile(r"[A-Za-z]{26,}")

# Heuristics for "clean paragraph boundary" lines we use as anchors when
# trimming a window's open/close edges. Used as a last-resort cleanup
# AFTER snap-to-blank, so excerpts never start mid-sentence even on
# scripts with inconsistent paragraph breaks.
SCENE_HEAD_RE = re.compile(
    r"^(INT|EXT|INT\./EXT|FADE|CUT TO|DISSOLVE|SMASH|MATCH CUT|BACK TO)\b",
    re.IGNORECASE,
)
# A trailing word that signals the sentence isn't done yet — drop the
# line if the excerpt's last line ends this way so the user doesn't see
# a sentence cut off in the middle.
INCOMPLETE_END_RE = re.compile(
    r"(?:[,;:\-]\s*$)|(?:\b(?:and|or|but|the|a|an|to|of|in|on|with|for|at|by|from|as|that|which|who|when|while|because)\s*$)",
    re.IGNORECASE,
)
MAX_TRIM = 4  # cap on how many lines we'll drop from either edge


def clean_excerpt(lines: list[str]) -> str:
    """
    Tidy a window of raw script lines for display:
      - rstrip every line
      - collapse internal whitespace runs
      - keep up to 8 spaces of leading indent so dialogue/action
        indentation hint survives the normalize
      - drop leading and trailing all-blank lines
    """
    out: list[str] = []
    for ln in lines:
        stripped = ln.rstrip("\r\n").rstrip()
        if not stripped:
            out.append("")
            continue
        leading = len(ln) - len(ln.lstrip())
        body = re.sub(r"\s+", " ", stripped.lstrip())
        out.append(" " * min(leading, 8) + body)
    while out and not out[0].strip():
        out.pop(0)
    while out and not out[-1].strip():
        out.pop()
    return "\n".join(out)


def load_script(slug: str) -> list[str] | None:
    path = SCRIPTS_DIR / f"{slug}.txt"
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8", errors="replace") as f:
        return f.readlines()


def looks_like_header(line: str) -> bool:
    """CHARACTER cue (all-caps short) or scene heading (INT./EXT./FADE/...).
    These are always safe excerpt-start anchors regardless of context."""
    s = line.strip()
    if not s:
        return False
    if SCENE_HEAD_RE.match(s):
        return True
    return s.isupper() and len(s) <= 40


def find_clean_lo(lines: list[str], raw_lo: int) -> int:
    """Drift `raw_lo` forward up to EDGE_DRIFT lines to land on a clean
    paragraph start. A line is a clean start if it's line 0, follows a
    blank line, follows a line ending with sentence terminator, or is
    itself a CHARACTER cue / scene heading. Falls back to raw_lo when
    no clean boundary exists in range — keeps a usable excerpt over
    nothing for scripts with very loose formatting."""
    n = len(lines)
    if raw_lo <= 0:
        return 0
    for offset in range(EDGE_DRIFT + 1):
        check = raw_lo + offset
        if check >= n:
            return raw_lo
        if check == 0:
            return 0
        if looks_like_header(lines[check]):
            return check
        prev = lines[check - 1].rstrip()
        if not prev:
            return check
        if prev[-1:] in '.!?"”':
            return check
    return raw_lo


def find_clean_hi(lines: list[str], raw_hi: int) -> int:
    """Mirror of find_clean_lo: drift `raw_hi` (exclusive end) backward
    up to EDGE_DRIFT lines so the last included line ends cleanly —
    sentence terminator or blank line below. Deliberately rejects
    CHARACTER cues / scene headings as end-anchors: ending on "JACK"
    (with the dialogue dropped) reads as a cut-off."""
    n = len(lines)
    if raw_hi >= n:
        return n
    for offset in range(EDGE_DRIFT + 1):
        check = raw_hi - offset
        if check <= 0:
            return raw_hi
        last = lines[check - 1].rstrip()
        if not last:
            return check
        if last[-1:] in '.!?"”' and not INCOMPLETE_END_RE.search(last):
            return check
    return raw_hi


def excerpts_for(slug: str, reversals: list[dict]) -> list[dict] | None:
    lines = load_script(slug)
    if not lines or len(lines) < 20:
        return None
    n = len(lines)
    out: list[dict] = []
    for r in reversals:
        pos = float(r.get("position", 0))
        if not 0 <= pos <= 1:
            continue
        idx = round(pos * (n - 1))
        lo = max(0, idx - WINDOW)
        hi = min(n, idx + WINDOW + 1)
        # Drift the window edges inward to clean paragraph boundaries.
        # find_clean_lo/hi look up to EDGE_DRIFT lines for a CHARACTER
        # cue, scene heading, blank-line break, or sentence-terminator
        # break — works for both well-formatted scripts and the many
        # MSDB filtered files where blank lines have been stripped.
        lo = find_clean_lo(lines, lo)
        hi = find_clean_hi(lines, hi)
        # Drop PDF-extraction garbage lines (long letter runs) so a single
        # corrupted line doesn't poison the whole window.
        window = [ln for ln in lines[lo:hi] if not GARBAGE_RE.search(ln)]
        out.append({"position": pos, "excerpt": clean_excerpt(window)})
    return out


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with REVERSALS_PATH.open("r", encoding="utf-8") as f:
        all_reversals = json.load(f)

    written = skipped_no_script = skipped_no_revs = 0
    for entry in all_reversals:
        slug = entry.get("slug")
        revs = entry.get("reversals") or []
        if not slug:
            continue
        if not revs:
            skipped_no_revs += 1
            continue
        excerpts = excerpts_for(slug, revs)
        if excerpts is None:
            skipped_no_script += 1
            continue
        out_path = OUTPUT_DIR / f"{slug}.json"
        with out_path.open("w", encoding="utf-8") as f:
            json.dump(
                {"slug": slug, "excerpts": excerpts},
                f,
                ensure_ascii=False,
                separators=(",", ":"),
            )
        written += 1

    print(f"wrote {written} excerpt files")
    print(f"skipped {skipped_no_script} (no script in MSDB filtered corpus)")
    print(f"skipped {skipped_no_revs} (empty reversals list)")


if __name__ == "__main__":
    main()
