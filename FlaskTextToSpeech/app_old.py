from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pyttsx3
import os
import uuid
import threading

app = Flask(__name__)
CORS(app)  # CORS sorunlarını çözmek için

# Thread-local TTS engine
engine_lock = threading.Lock()

def create_tts_engine():
    engine = pyttsx3.init()
    # Türkçe ses ayarları
    voices = engine.getProperty('voices')
    # Türkçe ses varsa kullan
    for voice in voices:
        if 'turkish' in voice.name.lower() or 'tr' in voice.languages:
            engine.setProperty('voice', voice.id)
            break
    # Konuşma hızı ve ses seviyesi
    engine.setProperty('rate', 150)  # Konuşma hızı (varsayılan 200)
    engine.setProperty('volume', 1.0)  # Ses seviyesi (0.0 - 1.0)
    return engine

@app.route('/test', methods=['GET'])
def test():
    return "Flask TTS with pyttsx3 is working!"
# Metni sese çeviren endpoint (pyttsx3 kullanarak)
@app.route('/text_to_speech', methods=['POST'])
def text_to_speech():
    try:
        # Gelen JSON verisini al
        data = request.get_json()
        if 'text' not in data:
            return jsonify({"error": "No text provided"}), 400

        text = data['text']
        language = data.get('language', 'tr')  # Varsayılan dil Türkçe
        
        # Boş text kontrolü
        if not text or len(text.strip()) == 0:
            return jsonify({"error": "Text is empty"}), 400

        # Benzersiz dosya adı oluştur
        output_file = f"output_{uuid.uuid4().hex[:8]}.wav"
        
        # Thread-safe TTS işlemi
        with engine_lock:
            engine = create_tts_engine()
            
            # Metni sese çevir ve dosyaya kaydet
            print(f"🔊 Seslendiriliyor: {text[:50]}...")
            engine.save_to_file(text, output_file)
            engine.runAndWait()
        
        # Ses dosyasını geri döndür
        response = send_file(output_file, mimetype="audio/wav", as_attachment=True, download_name="output.wav")
        
        # Dosyayı gönderdikten sonra sil (cleanup)
        @response.call_on_close
        def cleanup():
            try:
                if os.path.exists(output_file):
                    os.remove(output_file)
            except:
                pass
        
        return response

    except Exception as e:
        print(f"❌ Hata: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Flask uygulamasını çalıştır
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
