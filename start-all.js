import { spawn } from "child_process";
import path from "path";

console.log("🚀 TranslatorApp Tüm Servisler Başlatılıyor...");

const projects = [
  {
    name: "SpeechToTextToTranslate (Ana Proje)",
    // Manuel: npm run dev
    command: "npm run dev",
    cwd: "SpeechToTextToTranslate"
  },
  {
    name: "FlaskTextToSpeech (Python)",
    // Manuel: venv\Scripts\activate && python app.py
    command: "myenv\\Scripts\\activate && python app.py",
    cwd: "FlaskTextToSpeech"
  },
  {
    name: "FlaskSpeakerDiarize (Python)",
    command: "venv\\Scripts\\activate && python app.py",
    cwd: "FlaskSpeakerDiarize"
  },
  {
    name: "FlaskDetectLanguage (Python)",
    command: "venv\\Scripts\\activate && python app.py",
    cwd: "FlaskDetectLanguage"
  },
  {
    name: "ConnectTsApp (Bağlantı Servisi)",
    // Manuel: npm install && npm start
    command: "npm install && npm start",
    cwd: "ConnectTsApp"
  }
];

projects.forEach(p => {
  const proc = spawn(p.command, {
    cwd: path.join(process.cwd(), p.cwd),
    shell: true,
    stdio: "inherit"
  });

  proc.on("error", err => {
    console.log(`❌ ${p.name} başlatılamadı:`, err.message);
  });

  proc.on("close", code => {
    if (code !== 0 && code !== null) {
      console.log(`❌ ${p.name} kapandı. (Hata Kodu: ${code})`);
    }
  });
});


console.log("🚀 TranslatorApp Tüm Servisler Başlatıldı");
