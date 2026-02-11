import uuid
import os
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS
from faster_whisper import WhisperModel

app = Flask(__name__)
CORS(app)

# Whisper model (small = hızlı & yeterli)
model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)

@app.route("/detect_language", methods=["POST"])
def detect_language():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty file name"}), 400

    uid = str(uuid.uuid4())
    mp3_path = f"audio_{uid}.mp3"
    wav_path = f"audio_{uid}.wav"

    file.save(mp3_path)

    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", mp3_path, "-ac", "1", "-ar", "16000", wav_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        # Whisper dil tespiti
        segments, info = model.transcribe(
            wav_path,
            task="transcribe",
            language=None
        )

        language = info.language
        confidence = round(info.language_probability, 4)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        for f in (mp3_path, wav_path):
            if os.path.exists(f):
                os.remove(f)

    return jsonify({
        "predicted_language": language,
        "confidence_score": confidence
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
