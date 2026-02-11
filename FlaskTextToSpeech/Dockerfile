FROM python:3.9-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Sistem bağımlılıkları
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Python bağımlılıklarını yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama dosyasını kopyala
COPY app.py .

# Flask uygulamasını dışarıya aç
EXPOSE 5002

# Flask uygulamasını başlat
CMD ["python", "app.py"]
