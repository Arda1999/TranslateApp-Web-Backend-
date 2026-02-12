# Node.js 18 sürümünü kullan
FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# package.json ve yarn.lock dosyalarını kopyala
COPY package.json yarn.lock ./

# Bağımlılıkları yükle
RUN yarn install

# Uygulama dosyalarını kopyala
COPY . .

# Vite uygulamasının çalışacağı portu expose et
EXPOSE 3000

# Vite ve Express sunucusunu aynı anda çalıştır (host parametresiyle)
CMD ["yarn", "dev", "--host", "0.0.0.0"]
