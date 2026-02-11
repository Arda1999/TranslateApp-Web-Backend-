# Node.js'in resmi 16.x sürümünü kullanıyoruz
FROM node:16

# Çalışma dizinini /app olarak ayarlıyoruz
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyalıyoruz
COPY package*.json ./

# Bağımlılıkları yükle
RUN npm install

# Uygulama dosyalarını kopyala
COPY . .

# Sunucu portunu açıyoruz
EXPOSE 8080

# WebSocket sunucusunu başlatmak için gerekli komutu ayarlıyoruz
CMD ["node", "server.js"]
