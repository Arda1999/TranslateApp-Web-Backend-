import uuid
import os
import subprocess
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import whisper
import warnings
import shutil

warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app)

print("🔄 Whisper modeli yükleniyor...")

model = whisper.load_model("base")
print("✅ Model hazır!")

@app.route("/detect_language", methods=["POST"])
def detect_language():
    print("---- DEBUG START ----")
    print("Content-Type:", request.content_type)
    print("Headers:", dict(request.headers))
    print("Files:", request.files)
    print("Form:", request.form)
    print("---- DEBUG END ----")
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "Empty file name"}), 400

    uid = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or ".mp3"
    input_path = f"temp_{uid}{ext}"
    wav_path = f"temp_{uid}.wav"

    try:
        file.save(input_path)
        print(f"📁 Dosya kaydedildi: {input_path}")
        print(f"📦 Dosya boyutu: {os.path.getsize(input_path)} bytes")
        
        # FFmpeg ile dönüştür
        subprocess.run(
            ["ffmpeg", "-y", "-i", input_path, "-ac", "1", "-ar", "16000", wav_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        
        print(f"🔄 WAV dönüşümü tamamlandı: {wav_path}")
        print(f"📦 WAV boyutu: {os.path.getsize(wav_path)} bytes")

        # Whisper ile dil algılama
        audio = whisper.load_audio(wav_path)
        audio_duration = len(audio) / 16000  # 16kHz sample rate
        print(f"⏱️ Ses süresi: {audio_duration:.2f} saniye")
        
        audio = whisper.pad_or_trim(audio)
        
        # Mel spektrogram
        mel = whisper.log_mel_spectrogram(audio).to(model.device)
        
        # Dil tespiti
        _, probs = model.detect_language(mel)
        detected_lang = max(probs, key=probs.get)
        confidence = probs[detected_lang]
        
        print(f"🌍 Tespit edilen dil: {detected_lang}")
        print(f"📊 Güven skoru: {confidence:.4f}")
        print(f"📋 Tüm olasılıklar: {dict(sorted(probs.items(), key=lambda x: x[1], reverse=True)[:5])}")

        # Ses dosyasını tmp klasörüne kaydet (indirme için)
        download_filename = f"audio_{uid}.wav"
        download_path = os.path.join("tmp", download_filename)
        os.makedirs("tmp", exist_ok=True)
        shutil.copy(wav_path, download_path)
        print(f"💾 Ses dosyası kaydedildi: {download_path}")

        return jsonify({
            "predicted_language": detected_lang,
            "confidence_score": round(confidence, 4),
            "all_probabilities": {k: round(v, 4) for k, v in sorted(probs.items(), key=lambda x: x[1], reverse=True)[:5]},
            "download_url": f"/download/{download_filename}",
            "duration": audio_duration
        })
    
    except subprocess.CalledProcessError as e:
        return jsonify({
            "error": "FFmpeg conversion failed",
            "details": str(e)
        }), 500
    
    except Exception as e:
        return jsonify({
            "error": "Processing failed",
            "details": str(e)
        }), 500

    finally:
        for path in (input_path, wav_path):
            if os.path.exists(path):
                try:
                    os.remove(path)
                except:
                    pass

@app.route("/download/<filename>", methods=["GET"])
def download_audio(filename):
    """İşlenmiş ses dosyasını indir"""
    file_path = os.path.join("tmp", filename)
    
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404
    
    return send_file(
        file_path,
        mimetype="audio/wav",
        as_attachment=True,
        download_name=filename
    )

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "model": "whisper-base"})

if __name__ == "__main__":
    print("\n🚀 Flask API başlatılıyor...")
    print("📍 http://localhost:5000")
    print("📌 /detect_language - POST (multipart/form-data)")
    print("📌 /download/<filename> - GET (ses dosyası indir)")
    print("📌 /health - GET")
    app.run(host="0.0.0.0", port=5000, debug=True)