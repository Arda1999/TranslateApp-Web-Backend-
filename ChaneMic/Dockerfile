# Windows tabanlı bir node imajı kullanıyoruz
FROM mcr.microsoft.com/windows/servercore:1809 

# Node.js kurulumunu yapalım
RUN powershell -Command \
    Invoke-WebRequest -Uri https://nodejs.org/dist/v16.0.0/node-v16.0.0-x64.msi -OutFile nodejs.msi; \
    Start-Process msiexec.exe -ArgumentList '/i', 'nodejs.msi', '/quiet', '/norestart' -NoNewWindow -Wait; \
    Remove-Item -Force nodejs.msi

# Çalışma dizini
WORKDIR /app

# package.json ve package-lock.json dosyalarını kopyalıyoruz
COPY package*.json ./

# Bağımlılıkları yüklüyoruz
RUN npm install

# Uygulama dosyalarını kopyalıyoruz
COPY . .

# 3005 portunu dışa açıyoruz
EXPOSE 3005

# Uygulamayı başlatıyoruz
CMD ["node", "server.js"]
