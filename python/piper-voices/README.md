# Piper voice models

Voice model files (`.onnx`, `.onnx.json`) are not committed to git — they're
large binaries better fetched on demand.

## Setup

```bash
cd python/piper-voices
curl -L -o en_GB-alan-medium.onnx "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx"
curl -L -o en_GB-alan-medium.onnx.json "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_GB/alan/medium/en_GB-alan-medium.onnx.json"
```
