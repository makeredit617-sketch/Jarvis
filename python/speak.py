#!/usr/bin/env python3
"""
Simple one-shot TTS helper using Piper.
Usage: python3 speak.py "text to speak"
Synthesizes audio with Piper and plays it via aplay.
"""
import sys
import subprocess
import os

VOICE_MODEL = os.path.join(os.path.dirname(__file__), "piper-voices", "en_GB-alan-medium.onnx")


def main():
    if len(sys.argv) < 2:
        print("Usage: speak.py <text>", file=sys.stderr)
        sys.exit(1)

    text = sys.argv[1]

    piper = subprocess.Popen(
        ["python3", "-m", "piper", "-m", VOICE_MODEL, "--output-raw"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE
    )
    aplay = subprocess.Popen(
        ["aplay", "-r", "22050", "-f", "S16_LE", "-t", "raw"],
        stdin=piper.stdout
    )

    piper.stdin.write(text.encode("utf-8"))
    piper.stdin.close()
    piper.wait()
    aplay.wait()


if __name__ == "__main__":
    main()
