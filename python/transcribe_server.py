#!/usr/bin/env python3
"""
Persistent Whisper transcription server.

Reads JSON requests from stdin, one per line: {"id": "...", "audioPath": "..."}
Writes JSON responses to stdout, one per line: {"id": "...", "text": "..."}
or {"id": "...", "error": "..."}

The model loads once at startup, not per request, so repeated commands
stay fast after the first one.
"""
import sys
import json
import os
from faster_whisper import WhisperModel

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE_TYPE", "int8")


def main():
    model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    print(json.dumps({"type": "ready"}), flush=True)

    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue

        try:
            request = json.loads(line)
            request_id = request.get("id")
            audio_path = request.get("audioPath")

            if not audio_path or not os.path.isfile(audio_path):
                print(json.dumps({"id": request_id, "error": "Audio file not found"}), flush=True)
                continue

            segments, _info = model.transcribe(audio_path, beam_size=1)
            text = " ".join(segment.text.strip() for segment in segments).strip()

            print(json.dumps({"id": request_id, "text": text}), flush=True)
        except Exception as error:
            print(json.dumps({"id": request.get("id") if "request" in dir() else None, "error": str(error)}), flush=True)


if __name__ == "__main__":
    main()
