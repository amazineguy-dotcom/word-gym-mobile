"""Records every word and example sentence with Ava (the same voice and speed as the desktop Word Gym)
into audio/w/<id>.mp3 and audio/e/<id>.mp3, so the phone version needs no server.

Run with the desktop app's Python (it has edge-tts):
    ..\\word-gym\\.venv\\Scripts\\python.exe tools\\make_audio.py
Safe to stop and run again: files that already exist are skipped.
Clips already in the desktop app's .tts-cache are copied instead of recorded again.
"""
import asyncio
import hashlib
import json
import shutil
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
DESKTOP_CACHE = ROOT.parent / "word-gym" / ".tts-cache"
VOICE, RATE = "en-US-AvaNeural", "-8%"          # desktop: voice "ava", speed "normal"
EXTRA = {"hello": "Hello! Let's learn some words."}
PARALLEL = 4


def jobs():
    words = json.loads((ROOT / "words.json").read_text(encoding="utf-8"))["words"]
    for w in words:
        yield ROOT / "audio" / "w" / f"{w['id']}.mp3", w["w"]
        yield ROOT / "audio" / "e" / f"{w['id']}.mp3", w["ex"]
    for name, text in EXTRA.items():
        yield ROOT / "audio" / f"{name}.mp3", text


async def record(text: str) -> bytes:
    audio = bytearray()
    async for chunk in edge_tts.Communicate(text, VOICE, rate=RATE).stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
    if not audio:
        raise RuntimeError("no audio returned")
    return bytes(audio)


async def main():
    todo = [(p, t) for p, t in jobs() if not p.is_file()]
    total = len(todo)
    print(f"{total} clips to make", flush=True)
    sem = asyncio.Semaphore(PARALLEL)
    done = failed = copied = 0

    async def one(path: Path, text: str):
        nonlocal done, failed, copied
        path.parent.mkdir(parents=True, exist_ok=True)
        cached = DESKTOP_CACHE / (hashlib.sha1(f"{VOICE}|{RATE}|{text}".encode("utf-8")).hexdigest() + ".mp3")
        if cached.is_file():
            shutil.copyfile(cached, path); copied += 1
        else:
            async with sem:
                for attempt in range(4):
                    try:
                        path.write_bytes(await record(text)); break
                    except Exception as e:  # network hiccups: wait and retry
                        if attempt == 3:
                            failed += 1; print(f"FAILED {path.name}: {e}", flush=True); return
                        await asyncio.sleep(2 * (attempt + 1))
        done += 1
        if done % 100 == 0 or done == total:
            print(f"{done}/{total} done ({copied} copied from the desktop cache, {failed} failed)", flush=True)

    await asyncio.gather(*(one(p, t) for p, t in todo))
    print(f"finished: {done} made, {failed} failed", flush=True)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    asyncio.run(main())
