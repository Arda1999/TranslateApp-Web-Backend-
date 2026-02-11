1. Ana projeyi çalıştır.

    C:\Users\apeker\Desktop\Code\TranslatorApp\SpeechToTextToTranslate>npm run dev

    (bu komut ile ChanceMic projesini ayrı bir şekilde çalıştırmaya gerek kalmıyor. çalıştırmaya gerek yok bu projenini içerisinde serverChangeMic.cjs dosyası ile 3005 portunda bu işlem yapılyor. )

2.
    1)venv\Scripts\activate
    2)C:\Users\apeker\Desktop\Code\TranslatorApp\FlaskTextToSpeech\python app.py

3.
    1)venv\Scripts\activate
    2)C:\Users\apeker\Desktop\Code\TranslatorApp\FlaskSpeakerDiarize\python app.py

4.
    1)venv\Scripts\activate
    2)C:\Users\apeker\Desktop\Code\TranslatorApp\FlaskDetectLanguage>python app.py

5.
    1)C:\Users\apeker\Desktop\Code\TranslatorApp\ConnectTsApp\ npm i
    2)C:\Users\apeker\Desktop\Code\TranslatorApp\ConnectTsApp\  npm start


    !!!!!!!!CHANCE MİC projesi ni kullanmama nedenimiz SpeechTotextTranslate projesinde bu işlemi yapıyoruz.

    Yukarıda da bahsettim!!!!!!


VEYA HEPSİNİ TEK KOMUTTA ÇALIŞTIRMAK İSTERSEK, start-all.js KODUNU ÇALIŞTIR.

==> npm run start:all

---

## 🎙️ UYGULAMANIN ÇALIŞMA MANTIĞI

### **1. "Start Recording" Butonuna Basıldığında:**

**Adım 1: Ses Kaydı (5 saniye)**
- Mikrofondan 5 saniye boyunca ses kaydı alınır
- Ses MP3 formatında kaydedilir
- Bu süre zarfında konuşmanız dinlenir

**Adım 2: Mikrofon Değiştirilir**
- `changeMicrophone(3)` komutuyla mikrofon index **3**'e geçilir
- Port 3005'teki serverChangeMic.cjs üzerinden PowerShell komutu çalıştırılır

**Adım 3: Dil Tespiti**
- Kaydedilen 5 saniyelik ses dosyası Flask API'ye gönderilir (Port 5000)
- FlaskDetectLanguage servisi hangi dilde konuştuğunuzu tespit eder
- Örneğin: "tr: Turkish", "en: English", "de: German" vs.
- Otomatik olarak dil seçilir (languageSelect dropdown)

**Adım 4: Konuşma Tanıma Başlatılır**
- Web Speech API devreye girer (`recognition1.start()`)
- Sürekli dinleme modu aktif olur (`continuous: true`)
- Her kelime anlık olarak metne çevrilir
- Sonuçlar `result` div'inde gösterilir

**Adım 5: Otomatik Çeviri**
- Tanınan metin otomatik olarak çevrilir
- Türkçe ↔ İngilizce veya diğer diller arası çeviri
- Çevrilen metin `translatedResult` div'inde gösterilir
- Google Translate Free API kullanılır

---

### **2. "Start Speaking" Butonuna Basıldığında:**

Aynı işlemler gerçekleşir, ancak **farklı mikrofon** kullanılır:

```
startRecording()          → 5 sn ses kaydı + dil tespiti
listMicrophones()         → Mevcut mikrofonları listele
changeMicrophone(2)       → Mikrofon index 2'ye geç
recognition1.start()      → Konuşma tanımayı başlat
```

**Fark:** 

- "Get-AudioDevice -List" Komutu ile mevcut mikrofonlar listelenir.

- Eğer manuel mikrofon değiştirmek istersek;

        Set-AudioDevice -Index 3

        veya

        Set-AudioDevice -Index 2 

------------------------------------------------------------------------

- `Start Recording` → Mikrofon **3** kullanır ==> Sistemde çalan sesleri yakalar ( Stereo Mix (Realtek(R) Audio))

Start Recording (Yerel Test):
[Butona bas] 
  ↓
textToSpeechEnabled = false ⛔
  ↓
Mikrofon 3 (Stereo Mix)
  ↓
Konuşma tanıma çalışır ✅
  ↓
Çeviri yapılır ✅
  ↓
Seslendirme YAPILMAZ 🔇 (karışma yok!)
------------------------------------------------------------------------

- `Start Speaking` → Mikrofon **2** kullanır ==> Laptop’un dahili mikrofonu yani konuşmaları yakalar. (Microphone Array (Intel® Smart Sound Technology for Digital Microphones))

Start Speaking (WebSocket Modu):
[Butona bas]
  ↓
textToSpeechEnabled = true ✅
  ↓
Mikrofon 2 (Laptop Mic)
  ↓
Konuşma tanıma + Çeviri
  ↓
Seslendirme YAPILIR 🔊
  ↓
WebSocket ile karşı tarafa gönderilir 📡

Bu sayede farklı mikrofon girişleri arasında geçiş yapabilirsiniz.

------------------------------------------------------------------------

### **3. "Stop Recording" Butonuna Basıldığında:**

- Konuşma tanıma durdurulur (`recognition1.stop()`)
- Kayıt durumu sıfırlanır
- Butonlar tekrar aktif hale gelir

---

## 📊 UYGULAMANIN GENEL AKIŞI

```
[Butona Bas] 
    ↓
[5 saniye ses kaydı al]
    ↓
[Flask API'ye gönder → Dil Tespit Et (Port 5000)]
    ↓
[Dili otomatik seç]
    ↓
[Web Speech API başlat]
    ↓
[Konuş → Metin oluştur → Çevir → Göster]
    ↓
[Sürekli dinle (continuous mode)]
```

---

## 🔧 KULLANILAN SERVİSLER VE PORTLAR:

1. **Ana Uygulama (Port 3000):** Vite + React - Kullanıcı arayüzü
2. **Mikrofon Değiştirme (Port 3005):** serverChangeMic.cjs - PowerShell komutlarıyla mikrofon kontrolü
3. **Dil Tespiti (Port 5000):** FlaskDetectLanguage - Ses dosyasından dil tespiti
4. **Text-to-Speech (Port 5002):** FlaskTextToSpeech - Metni sese çevirme
5. **Speaker Diarization (Port 5001):** FlaskSpeakerDiarize - Konuşmacı ayrıştırma
6. **WebSocket Sunucusu (Port 8080):** ConnectTsApp - Kullanıcılar arası bağlantı

---

## 🎯 ÖZELLİKLER:

- ✅ Otomatik dil tespiti (ilk 5 saniyede)
- ✅ Gerçek zamanlı konuşma tanıma
- ✅ Anlık çeviri (çok dilli destek)
- ✅ Çoklu mikrofon desteği
- ✅ Konuşmacı ayrıştırma (diarization)
- ✅ Text-to-Speech dönüşüm
- ✅ WebSocket ile çok kullanıcılı iletişim

---

## 🌐 AYNI WiFi AĞINDAN BAŞKA CİHAZDAN BAĞLANMA

### **Sunucu Bilgisayarda (192.168.68.64):**

1. Tüm servisleri çalıştır:
   ```bash
   npm run start:all
   ```

2. Windows Güvenlik Duvarı ayarları:
   - **Windows Güvenlik** → **Güvenlik Duvarı ve ağ koruması** → **Gelişmiş ayarlar**
   - **Gelen Kurallar** → **Yeni Kural** → **Bağlantı noktası**
   - **TCP** seç ve şu portları ekle: `3000, 8080, 5002, 5000, 3005`
   - **Bağlantıya izin ver** → İsim ver: "TranslatorApp"

### **Diğer Cihazdan:**

Tarayıcıda şu adrese git:
```
http://192.168.68.64:3000
```

**NOT:** Tüm servisler (WebSocket, TTS, Detect Language, Mic Change) sunucu bilgisayarda çalışmalı. Diğer cihazda sadece tarayıcı yeterli.

---

## ⚠️ ÖNEMLİ: MİKROFON SEÇİMİ HAKKINDA

### **Sunucu Bilgisayarda (192.168.68.64):**
- Mikrofon değiştirme **çalışır** (PowerShell + AudioDeviceCmdlets)
- Start Recording → Mikrofon 3 (Stereo Mix - sistem sesleri)
- Start Speaking → Mikrofon 2 (Microphone Array - fiziksel mikrofon)

### **Mobil/Tablet/Diğer Bilgisayarlarda:**
- Mikrofon değiştirme servisi **erişilemez** (192.168.68.64:3005 çalışmaz)
- Uygulama **hata vermeden devam eder**
- **Varsayılan mikrofon** kullanılır (cihazın ana mikrofonu)
- Stereo Mix konsepti mobilde yoktur
- Her iki buton da (Start Recording/Speaking) aynı mikrofonu kullanır

**Çözüm:** 
- Remote cihazlardan sadece **Start Speaking** kullanın
- Mikrofon değiştirme uyarısı göz ardı edilebilir
- Mobil cihazlar default mikrofonla sorunsuz çalışır

---
