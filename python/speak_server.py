#!/usr/bin/env python3
"""
Persistent Piper TTS server.

Loads the voice model once at startup (not per request), then reads
JSON requests from stdin, one per line: {"id": "...", "text": "..."}
Synthesizes speech and plays it via aplay. Writes JSON responses to
stdout: {"id": "...", "done": true} or {"id": "...", "error": "..."}
"""
import sys
import json
import os
import wave
import subprocess
import tempfile
from piper import PiperVoice

MODEL_PATH = os.path.join(os.path.dirname(__file__), "piper-voices", "en_GB-alan-medium.onnx")


def main():
    voice = PiperVoice.load(MODEL_PATH)
    print(json.dumps({"type": "ready"}), flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        request = None
        try:
            request = json.loads(line)
            request_id = request.get("id")
            text = request.get("text", "")

            if not text.strip():
                print(json.dumps({"id": request_id, "done": True}), flush=True)
                continue

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp_path = tmp.name

            with wave.open(tmp_path, "wb") as wav_file:
                voice.synthesize_wav(text, wav_file)

            subprocess.run(["aplay", "-q", tmp_path])
            os.unlink(tmp_path)

            print(json.dumps({"id": request_id, "done": True}), flush=True)
        except Exception as error:
            request_id = request.get("id") if request else None
            print(json.dumps({"id": request_id, "error": str(error)}), flush=True)


if __name__ == "__main__":
    main()
