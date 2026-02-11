from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from gtts import gTTS
import os

app = Flask(__name__)
CORS(app)  # CORS sorunlarını çözmek için
@app.route('/test', methods=['GET'])
def test():
    return "Flask is working!"
# Metni sese çeviren bir endpoint
@app.route('/text_to_speech', methods=['POST'])
def text_to_speech():
    try:
        # Gelen JSON verisini al
        data = request.get_json()
        if 'text' not in data:
            return jsonify({"error": "No text provided"}), 400

        text = data['text']
        language = data.get('language', 'en')  # Varsayılan dil İngilizce

        # Metni sese çevir
        tts = gTTS(text, lang=language)
        output_file = "output.mp3"
        tts.save(output_file)

        # Ses dosyasını geri döndür
        return send_file(output_file, mimetype="audio/mp3", as_attachment=True, download_name="output.mp3")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Flask uygulamasını çalıştır
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002)
