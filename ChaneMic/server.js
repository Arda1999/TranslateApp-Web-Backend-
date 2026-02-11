// server.js
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const app = express();
const port = 3005;

// CORS'u etkinleştir
app.use(cors());

// Mikrofon değiştirme işlemi
app.get('/change-microphone/:index', (req, res) => {
  const index = req.params.index;
  const command = `"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Set-AudioDevice -Index ${index}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`PowerShell komutu çalıştırılırken hata oluştu: ${error.message}`);
      return res.status(500).send(`Hata: ${error.message}`);
    }
    if (stderr) {
      console.error(`PowerShell hatası: ${stderr}`);
      return res.status(500).send(`Hata: ${stderr}`);
    }
    console.log(`PowerShell çıktısı: ${stdout}`);
    res.send(`Mikrofon değiştirildi: ${stdout}`);
  });
});

app.listen(port, () => {
  console.log(`Sunucu ${port} portunda çalışıyor.`);
});
