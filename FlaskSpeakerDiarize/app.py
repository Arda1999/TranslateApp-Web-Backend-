import uuid  # Benzersiz kimlik oluşturmak için
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import wave
from pyannote.audio import Pipeline
import os

HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN")
#token artıkenv den geliyor
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the diarization pipeline
# Note: You must accept the terms at https://huggingface.co/pyannote/speaker-diarization-3.1
# and https://huggingface.co/pyannote/segmentation-3.0 before using this model
pipeline = Pipeline.from_pretrained(
    "pyannote/speaker-diarization-3.0",
    token=HUGGINGFACE_TOKEN
)

def check_wav_file(wav_file_path):
    try:
        with wave.open(wav_file_path, 'rb') as wav_file:
            num_frames = wav_file.getnframes()
            if num_frames < 16000:  # Minimum 1 saniye uzunluğunda olması gerekir
                return False
        return True
    except Exception as e:
        return False

@app.route('/diarize', methods=['POST'])
def diarize_audio():
    # Check if the file is part of the request
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']

    # Check if the file is empty
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    # Benzersiz dosya adı oluşturma
    unique_id = str(uuid.uuid4())
    mp3_file_path = f"uploads/recording_{unique_id}.mp3"
    wav_file_path = f"uploads/recording_{unique_id}.wav"

    # Save the file to disk
    os.makedirs('uploads', exist_ok=True)  # Ensure the 'uploads' directory exists
    file.save(mp3_file_path)

    try:
        # MP3 dosyasını WAV formatına dönüştür
        subprocess.run([
            "ffmpeg", "-i", mp3_file_path, "-ac", "1", "-ar", "16000", "-f", "wav", wav_file_path
        ], check=True)
        print(f"Converted MP3 to WAV: {wav_file_path}")
    except subprocess.CalledProcessError as e:
        return jsonify({"error": "FFmpeg conversion failed", "details": str(e)}), 500

    # Verify that the WAV file exists and is accessible
    if not os.path.isfile(wav_file_path) or not check_wav_file(wav_file_path):
        return jsonify({"error": f"Invalid or corrupted WAV file: {wav_file_path}"}), 400

    try:
        # Run the diarization pipeline on the WAV file
        diarization = pipeline(wav_file_path)
        if not diarization:
            return jsonify({"error": "Diarization returned empty result"}), 500

        # Save the result to an RTTM file
        rttm_path = f"result_{os.path.basename(wav_file_path)}.rttm"
        with open(rttm_path, 'w') as rttm_file:
            diarization.write_rttm(rttm_file)

        # RTTM içeriğini oku ve konsola yazdır
        with open(rttm_path, 'r') as rttm_file:
            rttm_content = rttm_file.read()
            print("RTTM Dosyası İçeriği:\n", rttm_content)  # Konsola yazdırma

        return jsonify({
            "message": "Diarization complete",
            "rttm_content": rttm_content  # JSON yanıtında döndürme
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up uploaded and converted files
        if os.path.exists(mp3_file_path):
            os.remove(mp3_file_path)
        if os.path.exists(wav_file_path):
            os.remove(wav_file_path)

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5001)
