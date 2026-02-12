import JsGoogleTranslateFree from "@kreisler/js-google-translate-free";
import { listMicrophones, changeMicrophone} from './microphone.js';

// API host'u otomatik seç - Sayfayı hangi adresten açıyorsan o adresi kullan
const currentHost = window.location.hostname;
const currentProtocol = window.location.protocol; // http: veya https:
const API_HOST = `${currentProtocol}//${currentHost}`;
console.log(`🌐 API Host: ${API_HOST} (Otomatik algılandı)`);

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const languageSelect = document.getElementById('languageSelect');
const clearBtn = document.getElementById('clearBtn');
const clearBtnVoice = document.getElementById('clearBtnVoice');



const startBtn2 = document.getElementById('startBtn2');
let recognition1;

let resultElement1 = document.getElementById('result');

let recognizing = false; 
let restartTimeout;
let mediaRecorder;
let audioChunks = [];
let speakingQueue = []; // Seslendirme kuyruğu
let isSpeaking = false; // Şu anda seslendirme yapılıp yapılmadığını takip eder
let textToSpeechEnabled = true; // Seslendirmeyi kontrol eden bayrak (Start Recording'de false olacak)

const AUTO_DETECT_DURATION_MS = 4000;
const RECOGNITION_RESTART_DELAY_MS = 500;
// SnackBar ve Loading Bar fonksiyonları
function showSnackbar(message) {
  const snackbar = document.getElementById('snackbar');
  snackbar.textContent = message;
  snackbar.className = 'show';
  
  setTimeout(() => {
    snackbar.className = snackbar.className.replace('show', '');
  }, 3000);
}

function showLoadingBar() {
  // Üstteki loading bar'ı göster
  const loadingBar = document.getElementById('loadingBar');
  if (loadingBar) {
    loadingBar.style.display = 'block';
  }
  
  // Otomatik Dil Tespiti yanındaki spinner'ı göster
  const spinner = document.getElementById('languageDetectionSpinner');
  if (spinner) {
    spinner.classList.add('active');
  }
}

function hideLoadingBar() {
  // Üstteki loading bar'ı gizle
  const loadingBar = document.getElementById('loadingBar');
  if (loadingBar) {
    loadingBar.style.display = 'none';
  }
  
  // Otomatik Dil Tespiti yanındaki spinner'ı gizle
  const spinner = document.getElementById('languageDetectionSpinner');
  if (spinner) {
    spinner.classList.remove('active');
  }
}




async function setAudioInputDevice() {
  recognition1 = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition1.lang = languageSelect.value;
  recognition1.continuous = true;  // Sürekli kayıt
  recognition1.interimResults = true;  // Anlık sonuçları al
  
  recognition1.onstart = () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    recognizing = true;
    console.log('Recording started');
  };

  recognition1.onresult = async function (event) {
    let interimTranscript = '';
    let fullTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) { // Burada result alanındaki text siliniyor ya arada bir burada yapılıyor.
        const finalTranscript = event.results[i][0].transcript.trim();
        fullTranscript += finalTranscript + ' ';
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    resultElement1.innerText = fullTranscript + interimTranscript;
 
    // Çeviriyi yalnızca metin tamamlandığında yapalım
    if (event.results[event.results.length - 1].isFinal) {
      handleTranslation(fullTranscript);
    }
    
    let translatedText = '';
    if (languageSelect.value === 'tr-TR') {
        // Türkçe'den İngilizce'ye çeviriyoruz
        translatedText = await translateTextToEnglish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'en-US') {
        // İngilizce'den Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    }
        else if (languageSelect.value === 'fr-FR') {
        // Fransızca'dan Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'de-DE') {
        // Almanca'dan Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'es-ES') {
        // İspanyolca'dan Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'it-IT') {
        // İtalyanca'dan Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'pt-PT') {
        // Portekizce'den Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'ru-RU') {
        // Rusça'dan Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'ja-JP') {
        // Japonca'dan Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'zh-CN') {
        // Çince'den Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'ar-SA') {
        // Arapça'dan Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'ko-KR') {
        // Korece'den Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    } else if (languageSelect.value === 'hi-IN') {
        // Hintçe'den Türkçe'ye çeviriyoruz
        translatedText = await translateTextToTurkish(fullTranscript + interimTranscript);
        document.getElementById('translatedResult').innerText = translatedText;
    }

       
        document.getElementById('translatedResult').innerText = translatedText;
    
        if (event.results[event.results.length - 1].isFinal) {
          // Yeni div oluşturuluyor ve son metin ekleniyor
          const newResultDiv = document.createElement('div');
          newResultDiv.classList.add('result', 'border', 'p-3', 'mb-3');
          // Let CSS control sizing so the history panel can stay compact and scrollable
      
          // Başlık ekliyoruz
          const header = document.createElement('h4');
          header.innerText = `Sonuç`;
          newResultDiv.appendChild(header);
      
          // Orijinal metin
          const originalTextDiv = document.createElement('div');
          originalTextDiv.classList.add('original-text');
          originalTextDiv.innerText = 'Orjinal: ' + fullTranscript;
          originalTextDiv.style.fontWeight = 'bold';
          originalTextDiv.style.color = 'black';
          newResultDiv.appendChild(originalTextDiv);
      
          const line = document.createElement('hr');
          newResultDiv.appendChild(line);
      
          // Çevrilmiş metin
          let translatedText = '';
          if (languageSelect.value === 'tr-TR') {
              // Türkçe'den İngilizce'ye çevir
              translatedText = await translateTextToEnglish(fullTranscript);
          } else {
              // Diğer tüm dillerden Türkçe'ye çevir
              translatedText = await translateTextToTurkish(fullTranscript);
          }          
          const translatedTextDiv = document.createElement('div');
          translatedTextDiv.classList.add('translated-text');
          translatedTextDiv.innerText = 'Çevirisi: ' + translatedText;
          translatedTextDiv.style.fontWeight = 'bold';
          translatedTextDiv.style.color = 'black';
          newResultDiv.appendChild(translatedTextDiv);
      
          // Yeni sonucu ekliyoruz
          const historyContainer =
            document.getElementById('resultsHistory') ||
            document.getElementById('resultsContainer');

          if (historyContainer) {
            historyContainer.appendChild(newResultDiv);
          } else {
            console.warn('No results history container found (#resultsHistory or #resultsContainer). Skipping append.');
          }
      
          // Kuyruğa ekleme
          speakingQueue.push(newResultDiv);
          console.log('Yeni çeviri kuyruğa eklendi:', translatedText);
      
          // Seslendirme işlevini çağır
          playAllTranslations();
        }

   
  };

  recognition1.onerror = function (event) {
    console.error('Speech recognition error:', event.error);
    if (recognizing && event.error !== 'aborted') {
      restartRecognition();
    }
  };

  recognition1.onend = function () {
    if (!recognizing) {  // Ensure it doesn't restart unless the recognition is still intended
      startBtn.disabled = false;
      stopBtn.disabled = true;
      console.log('Speech recognition stopped');
    }
  };
  
  playAllTranslations();
  recognition1.start();


}


async function playAllTranslations() {
  // Seslendirme devre dışıysa kuyruğu temizle ve çık
  if (!textToSpeechEnabled) {
    console.log('⛔ Text-to-Speech devre dışı (Start Recording modu)');
    speakingQueue = []; // Kuyruğu temizle
    return;
  }

  // Kuyruktaki sırayla seslendirme yapılır
  if (isSpeaking) return; // Şu anda başka bir seslendirme varsa, bekle
  isSpeaking = true;

  while (speakingQueue.length > 0) {
    const currentDiv = speakingQueue.shift(); // Kuyruktan sıradaki div'i al
    const translatedDiv = currentDiv.querySelector('.translated-text');
    if (translatedDiv) {
      const translatedText = translatedDiv.innerText.replace('Çevirisi: ', '').trim();
      if (translatedText) {
        console.log('🔊 Seslendiriliyor:', translatedText);
        
        // Hedef dili belirle
        // Türkçe konuşuluyorsa → İngilizce seslendirme
        // Diğer tüm diller → Türkçe seslendirme
        const targetLanguage = languageSelect.value === 'tr-TR' ? 'en' : 'tr';
        console.log(`🌍 Kaynak dil: ${languageSelect.value} → Seslendirme dili: ${targetLanguage}`);
        
        const audioUrl = await sendTextToSpeechAPI(translatedText, targetLanguage); // MP3 dosyasını al
        
        // Sadece Start Speaking butonuna basıldıysa WebSocket'e gönder
        if (window.sendToWebSocket === true) {
          await sendAudioOverWebSocket(audioUrl); // WebSocket ile gönder
          console.log('📡 Ses WebSocket üzerinden karşı tarafa gönderildi');
        } else {
          console.log('💻 Yerel mod - Ses oluşturuldu ama hiçbir yere gönderilmedi');
        }
        
        // Kendi tarafında ÇALMASIN - sadece karşı tarafa gitsin
        // await playAudio(audioUrl); // KALDIRILDI
      }
    }
  }

  isSpeaking = false; // Kuyruk bittiğinde seslendirme işlemi durur

  
}

async function sendAudioOverWebSocket(audioUrl) {
  try {
    const audioBlob = await fetch(audioUrl).then(response => response.blob()); // MP3 dosyasını al
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const audioBase64 = reader.result.split(',')[1]; // Base64 formatına çevir
      
      // targetUserId input değerini al
      const targetUserId = document.getElementById('targetUserId').value;
      
      // WebSocket üzerinden base64 verisini gönder
      const message = {
        type: 'audio',
        audioData: audioBase64,  // Base64 formatındaki ses verisi
        targetUserId: targetUserId // Hedef kullanıcı ID'si
      };

      socket.send(JSON.stringify(message));  // WebSocket'e gönderim
      console.log('Ses verisi WebSocket üzerinden gönderildi');
    };

    reader.readAsDataURL(audioBlob);  // MP3 dosyasını base64 formatında okuma
  } catch (error) {
    console.error('Error while sending audio over WebSocket:', error);
  }
}

async function playAudio(audioUrl) {
  try {
    const audio = new Audio(audioUrl);
    await audio.play();
    console.log('Audio is playing');
    return new Promise((resolve) => {
      audio.onended = resolve; // Ses tamamlanınca devam eder
    });
  } catch (error) {
    console.error('Error while playing audio:', error);
  }
}


async function sendTextToSpeechAPI(text, targetLanguage = 'tr') {
  try {
    const response = await fetch(`${API_HOST}:5002/text_to_speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: text, language: targetLanguage }),
    });

    if (!response.ok) {
      throw new Error('Seslendirme API isteği başarısız oldu');
    }

    // Dönen MP3 dosyasını URL olarak al
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Seslendirme API çağrısı sırasında hata oluştu:', error);
  }
}


async function handleTranslation(text) {
  let translatedText = '';
  try {
    const startTime = Date.now(); // Zaman başlatılıyor

    // Çeviri işlemi
    if (languageSelect.value === 'tr-TR') {
      translatedText = await translateTextToEnglish(text);
    } else if (languageSelect.value === 'en-US') {
      translatedText = await translateTextToTurkish(text);
    } else {
      translatedText = await translateTextToTurkish(text);
    }

   
  } catch (error) {
    console.error("Çeviri hatası:", error);
    document.getElementById('translatedResult').innerText = 'Çeviri hatası';
  }
}

async function translateTextToEnglish(text) {
  try {
    const from = "tr"; 
    const to = "en";   
    const translation = await JsGoogleTranslateFree.translate({ from, to, text });
    return translation; 
  } catch (error) {
    console.error("Error during translation:", error);
    return "Translation error"; 
  }
}

async function translateTextToTurkish(text) {
  try {
    const from = "auto"; // Otomatik kaynak dil tespiti (tüm dilleri destekler)
    const to = "tr";   
    const translation = await JsGoogleTranslateFree.translate({ from, to, text });
    return translation; 
  } catch (error) {
    console.error("Error during translation:", error);
    return "Translation error"; 
  }
}

function restartRecognition() {
  recognition1.start(); // Force recognition to restart
  console.log('Recognition restarted');
}

// Akıllı mikrofon seçimi - Her cihazda çalışır
async function selectBestMicrophone(preferStereoMix = false) {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter(device => device.kind === 'audioinput');
    
    console.log('🎤 Mevcut mikrofonlar:');
    audioInputs.forEach((device, index) => {
      console.log(`  ${index}: ${device.label || 'Unnamed'} (${device.deviceId})`);
    });
    
    let selectedDevice = null;
    
    if (preferStereoMix) {
      // Start Recording → Stereo Mix/System Audio ara (sistem seslerini yakala)
      const stereoMixKeywords = ['stereo mix', 'what u hear', 'wave out', 'loopback', 'system audio', 'ses karışık', 'stereo mikser'];
      selectedDevice = audioInputs.find(device => 
        stereoMixKeywords.some(keyword => device.label.toLowerCase().includes(keyword))
      );
      
      if (selectedDevice) {
        console.log('✅ Stereo Mix bulundu:', selectedDevice.label);
      } else {
        console.log('⚠️ Stereo Mix bulunamadı, varsayılan mikrofon kullanılacak');
      }
    } else {
      // Start Speaking → Fiziksel mikrofon (Microphone Array tercih et)
      const stereoMixKeywords = ['stereo mix', 'what u hear', 'wave out', 'loopback', 'system audio', 'ses karışık', 'stereo mikser'];
      
      // Önce Microphone Array ara
      const micArrayKeywords = ['microphone array', 'mic array', 'array'];
      const microphoneArray = audioInputs.find(device => {
        const label = device.label.toLowerCase();
        return micArrayKeywords.some(keyword => label.includes(keyword)) &&
               !stereoMixKeywords.some(keyword => label.includes(keyword));
      });
      
      if (microphoneArray) {
        selectedDevice = microphoneArray;
        console.log('✅ Microphone Array bulundu ve seçildi:', selectedDevice.label);
      } else {
        // Microphone Array yoksa Stereo Mix olmayanları bul
        const physicalMics = audioInputs.filter(device => 
          !stereoMixKeywords.some(keyword => device.label.toLowerCase().includes(keyword))
        );
        
        if (physicalMics.length > 0) {
          selectedDevice = physicalMics[0]; // İlk fiziksel mikrofonu seç
          console.log('✅ Fiziksel mikrofon seçildi:', selectedDevice.label);
        } else {
          console.log('⚠️ Fiziksel mikrofon bulunamadı, varsayılan kullanılacak');
        }
      }
    }
    
    return selectedDevice ? selectedDevice.deviceId : null;
  } catch (error) {
    console.error('❌ Mikrofon listesi alınamadı:', error);
    return null;
  }
}

async function startAudioRecording(preferStereoMix = false) {
  console.log(`🎤 Mikrofon seçimi başlatılıyor (Stereo Mix tercih: ${preferStereoMix})`);
  
  // Akıllı mikrofon seçimi
  const selectedDeviceId = await selectBestMicrophone(preferStereoMix);
  
  const constraints = {
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 2
    }
  };
  
  // Eğer özel mikrofon seçildiyse deviceId ekle
  if (selectedDeviceId) {
    constraints.audio.deviceId = { exact: selectedDeviceId };
    console.log('🎯 Özel mikrofon seçildi:', selectedDeviceId);
  } else {
    console.log('🎯 Varsayılan mikrofon kullanılacak');
  }
  
  navigator.mediaDevices.getUserMedia(constraints)
    .then(stream => {
      console.log('✅ Mikrofon akışı başladı:', stream.getAudioTracks()[0].label);
      
      // Web Audio API ile ses seviyesini artır
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      
      // Ses seviyesini 3 kat artır (dikkat: çok yüksek olursa distortion olur)
      gainNode.gain.value = 3.0;
      console.log('🔊 Ses seviyesi artırıldı: x3.0');
      
      source.connect(gainNode);
      
      // Yeni stream oluştur (gain eklenmiş)
      const destination = audioContext.createMediaStreamDestination();
      gainNode.connect(destination);
      const gainedStream = destination.stream;
      
      // Desteklenen codec'i kontrol et ve kullan
      let options = { mimeType: 'audio/webm;codecs=opus' };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.warn('audio/webm;codecs=opus desteklenmiyor, audio/webm deneniyor');
        options = { mimeType: 'audio/webm' };
        
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          console.warn('audio/webm desteklenmiyor, varsayılan kullanılıyor');
          options = {};
        }
      }
      
      console.log('🎤 Kullanılan MIME type:', options.mimeType || 'varsayılan');
      
      // MediaRecorder oluşturuluyor (gainedStream kullan)
      mediaRecorder = new MediaRecorder(gainedStream, options);
      audioChunks = []; // Ses parçalarını depolamak için sıfırlanır

      // Veri alındığında tetiklenir
      mediaRecorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
          // Ses parçası eklendi logu kaldırıldı (çok fazla spam yapıyordu)
        }
      };

      // Her 100ms'de bir veri chunk'ı al (daha düzgün kayıt)
      mediaRecorder.start(100);
      console.log('✅ Ses kaydı başlatıldı, MIME:', mediaRecorder.mimeType);
    })
    .catch(error => {
      console.error('❌ Mikrofon erişim hatası:', error);
    });
}


function startRecording(preferStereoMix = false) {
  recognizing = true;
  startAudioRecording(preferStereoMix); // Mikrofon tercihi ile ses kaydı başlat

  // Auto dil tespiti checkbox kontrolü
  const autoDetect = document.getElementById('autoDetectLanguage').checked;
  
  if (autoDetect) {
    // Otomatik dil tespiti aktif - önce ses örneği al, sonra Web Speech API başlat
    console.log(`🤖 Otomatik dil tespiti aktif - ${AUTO_DETECT_DURATION_MS / 1000} saniye örnek alınıyor...`);
    console.log('⏳ Web Speech API dil tespit edilene kadar bekleyecek...');

    // Sadece ses kaydını al, Web Speech API'yi BAŞLATMA
    // detectLanguageFromAudio içinde dil tespit edildikten sonra başlatılacak
    
    // Kısa süre sonra kaydı durdur ve Flask'a gönder
    setTimeout(() => {
      stopRecordingForDetect();
      console.log(`⏱️ ${AUTO_DETECT_DURATION_MS / 1000} saniye kayıt tamamlandı - dil tespiti başlatılıyor...`);
    }, AUTO_DETECT_DURATION_MS);
  } else {
    // Manuel dil seçimi - Direkt speech to text başlat
    console.log('👤 Manuel dil seçimi - Direkt konuşma tanıma başlatılıyor...');
    // Kaydı hemen durdur (dil tespiti yok)
    setTimeout(() => {
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
      }
      
      // Direkt Web Speech API'yi başlat
      setAudioInputDevice();
      setTimeout(() => {
        if (recognition1) {
          recognition1.start();
          console.log('🎤 Web Speech API başlatıldı (Manuel mod)');
        }
      }, 200);
    }, 100);
  }
}

async function detectLanguageFromAudio(audioBlob) {
  try {
    // Loading bar göster
    showLoadingBar();
    
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📤 DİL TESPİTİ API'YE GÖNDERİLİYOR");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📦 Ses dosyası boyutu:", audioBlob.size, "bytes");
    console.log("🎵 MIME type:", audioBlob.type);
    console.log("🔗 API URL:", `${API_HOST}:5000/detect_language`);

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.mp3');

    const response = await fetch(`${API_HOST}:5000/detect_language`, {
      method: 'POST',
      body: formData,
    });

    // Loading bar gizle
    hideLoadingBar();

    if (response.ok) {
      const data = await response.json();
      const confidence = data.confidence_score || 0;

      console.log("🎯 Confidence kontrol:", confidence);

      // Güven skoru kontrolü
      if (confidence < 0.75) {
        console.warn("❌ Dil güven skoru düşük:", confidence);

        // SnackBar göster
        showSnackbar("Üzgünüm… tekrar deneyin veya dili manuel seçin");

        // Web Speech API başlatılmasın
        recognizing = false;

        return; // BURADA DUR! Devam etmesin
      }
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📥 API YANITINI ALDI");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📥 Tam API Yanıtı:", JSON.stringify(data, null, 2));
      console.log("🌍 Dil Tahmini:", data.predicted_language);
      console.log("📊 Güven Skoru:", data.confidence_score);
      if (data.all_probabilities) {
        console.log("📋 Tüm olasılıklar:", data.all_probabilities);
      }

      let langCode = data.predicted_language;
      if (Array.isArray(langCode)) {
        const detectedLangStr = langCode[0] || '';
        langCode = detectedLangStr.split(':')[0].trim();
      }

      console.log("🌍 Tespit edilen dil kodu:", langCode);

      const langMapping = {
        'tr': 'tr-TR',
        'en': 'en-US',
        'fr': 'fr-FR',
        'de': 'de-DE',
        'es': 'es-ES',
        'it': 'it-IT',
        'pt': 'pt-PT',
        'ru': 'ru-RU',
        'ja': 'ja-JP',
        'zh': 'zh-CN',
        'ar': 'ar-SA',
        'ko': 'ko-KR',
        'hi': 'hi-IN',
        'nn': 'tr-TR',
        'jw': 'tr-TR'
      };

      const mappedLang = langMapping[langCode] || 'tr-TR';
      console.log("📍 Eşleştirilen dil:", mappedLang);

      selectLanguage(mappedLang);
      
      // Otomatik ses dosyası indirme
      if (data.download_url) {
        console.log("⬇️ Ses dosyası otomatik indiriliyor...");
        const downloadUrl = `${API_HOST}:5000${data.download_url}`;
        
        // Otomatik indirme için invisible link oluştur
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `detected_audio_${data.predicted_language}_${new Date().getTime()}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log("✅ Ses dosyası indirildi:", a.download);
      }
      
      // Dil tespit edildikten sonra Web Speech API'yi başlat
      console.log("⏳ Dil tespit tamamlandı, Web Speech API başlatılıyor...");
      
      setAudioInputDevice();
      setTimeout(() => {
        if (recognition1) {
          recognition1.start();
          console.log(`🎤 Web Speech API başlatıldı (Tespit edilen dil: ${mappedLang})`);
        }
      }, RECOGNITION_RESTART_DELAY_MS);
      
    } else {
      hideLoadingBar();
      console.error("Dil tespiti API Hatası:", await response.text());
      showSnackbar("Dil tespiti başarısız. Lütfen tekrar deneyin.");
    }
  } catch (error) {
    hideLoadingBar();
    console.error("POST isteği gönderilirken hata oluştu:", error);
    showSnackbar("Bağlantı hatası. Lütfen tekrar deneyin.");
  }
}

function stopRecordingForDetect() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.onstop = async () => {
      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunks, { type: mimeType });

      console.log('🎵 Kaydedilen ses formatı:', mimeType);
      console.log('📊 Toplam chunk sayısı:', audioChunks.length);
      console.log('📦 Toplam blob boyutu:', audioBlob.size, 'bytes');

      await detectLanguageFromAudio(audioBlob);
    };

    mediaRecorder.stop();
    console.log('Ses kaydı durduruldu (auto detect) ve dil tespiti başlatıldı.');
  }
}



async function stopRecording() {
  recognizing = false;
  clearTimeout(restartTimeout);

  if (recognition1 && typeof recognition1.stop === 'function') {
    recognition1.stop();
  }

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.onstop = async () => {
      // Tüm ses chunk'larını birleştir
      const mimeType = mediaRecorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      
      console.log('🎵 Kaydedilen ses formatı:', mimeType);
      console.log('📊 Toplam chunk sayısı:', audioChunks.length);
      console.log('📦 Toplam blob boyutu:', audioBlob.size, 'bytes');
      // ✅✅✅ BURAYA EKLEYİN ✅✅✅
      //downloadAudioRecording(audioBlob, mimeType);
      // ✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

      await detectLanguageFromAudio(audioBlob);
    };

    mediaRecorder.stop(); 
    console.log('Ses kaydı durduruldu ve API ile WebSocket işlemi başlatıldı.');
    
  }
}




function selectLanguage(predictedLanguage) {
  const languageSelect = document.getElementById('languageSelect');
  const options = languageSelect.querySelectorAll('option');

  console.log("🔍 Dil seçimi yapılıyor:", predictedLanguage);
  
  let found = false;
  // Tüm seçenekleri kontrol edip, tahmin edilen dil ile eşleşeni seçiyoruz
  options.forEach(option => {
    if (option.value === predictedLanguage) {
      option.selected = true;
      found = true;
      console.log("✅ Dil dropdown'da seçildi:", option.text);
    }
  });
  
  if (!found) {
    console.warn("⚠️ Dil dropdown'da bulunamadı:", predictedLanguage);
  }

  // Seçimden sonra recognition.lang'ı güncelle
  updateLanguage();
}
function updateLanguage() {
  if (recognition1) {
    recognition1.stop(); // Eski tanımayı durdur
    recognition1.lang = languageSelect.value; // Yeni dil ayarını yap
    setTimeout(() => {
      recognition1.start(); // Yeni dil ile yeniden başlat
    }, RECOGNITION_RESTART_DELAY_MS); // Kısa bir süre bekleyip yeniden başlat
  }
}

function clearTranscriptAll() {
  audioChunks = []; // Ses parçalarını temizle
  speakingQueue = []; // Seslendirme kuyruğunu temizle
  isSpeaking = false; // Seslendirme bayrağını sıfırla
  
  if (recognition1) {
    recognition1.stop();
  }
  
  // Çevirilen metni temizle
  const translatedResultElement = document.getElementById('translatedResult');
  const resultElement1 = document.getElementById('result');
  if (translatedResultElement) translatedResultElement.innerText = '';
  if (resultElement1) resultElement1.innerText = '';

  // Dinamik sonuç kartlarını temizle (geçmiş sonuçlar)
  const historyContainer = document.getElementById('resultsHistory');
  if (historyContainer) {
    historyContainer.innerHTML = '';
    console.log('✅ Geçmiş sonuçlar temizlendi');
  }
  
  // Fallback container da temizlensin
  const resultsContainer = document.getElementById('resultsContainer');
  if (resultsContainer) {
    resultsContainer.innerHTML = '';
  }

  // Gelen sesli mesajları temizle (incoming audio)
  const incomingAudioContainer = document.getElementById('incomingAudioContainer');
  if (incomingAudioContainer) {
    incomingAudioContainer.innerHTML = '';
    console.log('✅ Gelen sesli mesajlar temizlendi');
  }

  console.log('✅ Tüm içerik temizlendi (transcript, sonuçlar, sesler)');
}

// START RECORDING - Sadece yerel çalışır (WebSocket kullanmaz)
startBtn.addEventListener('click', async() => {
  console.log('🎙️ Start Recording: Yerel mod (WebSocket yok)');
  console.log('⛔ Text-to-Speech devre dışı bırakıldı (ses karışmasını önlemek için)');
  textToSpeechEnabled = false;
  startRecording(true); // Stereo Mix tercih et (sistem sesleri)
  await listMicrophones();
  // changeMicrophone(3) kaldırıldı - tarayıcı otomatik seçiyor
  resultElement1 = document.getElementById('result');
});

// START SPEAKING - WebSocket ile ses gönderir
startBtn2.addEventListener('click', async () => {
  console.log('🗣️ Start Speaking: WebSocket modu (ses karşı tarafa gönderilir)');
  console.log('✅ Text-to-Speech aktif');
  textToSpeechEnabled = true;
  
  // Önce WebSocket bağlantısını kontrol et
  const targetUserId = document.getElementById('targetUserId').value;
  if (!targetUserId) {
    alert('Önce "Bağlantı Kur" butonuna basarak hedef kullanıcıyla bağlantı kurun!');
    return;
  }

  // Yerel kaydı başlat
  startRecording(false); // Fiziksel mikrofon tercih et (konuşmalar)
  await listMicrophones();
  // changeMicrophone(2) kaldırıldı - tarayıcı otomatik seçiyor
  resultElement1 = document.getElementById('result');
  
  // WebSocket ile ses gönderme işlemi için flag ayarla
  window.sendToWebSocket = true;
  window.targetUserId = targetUserId;
});

stopBtn.addEventListener('click', () => {
  if (recognition1) {
    recognition1.stop();  // Stop the recognition
    recognizing = false;  // Reset the recognizing flag
    startBtn.disabled = false;
    stopBtn.disabled = true;
    window.sendToWebSocket = false; // WebSocket gönderimini durdur
    textToSpeechEnabled = true; // Stop'ta seslendirmeyi tekrar aç
    console.log('Speech recognition stopped');
  }
});

function clearRemoteVoiceMessages() {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.warn('⚠️ WebSocket bağlı değil, karşı tarafa mesaj gönderilemedi');
    return;
  }

  const targetUserId = document.getElementById('targetUserId')?.value;

  const message = {
    type: 'clear_voice',
    targetUserId: targetUserId
  };

  socket.send(JSON.stringify(message));
  console.log('🧹 Karşı tarafa ses temizleme komutu gönderildi');
}

// Event listener'ları sadece elementler varsa ekle
if (languageSelect) {
  languageSelect.addEventListener('change', updateLanguage);
}

if (clearBtn) {
  clearBtn.addEventListener('click', clearTranscriptAll);
}

if (clearBtnVoice) {
  clearBtnVoice.addEventListener('click', () => {
    console.log('🧹 Clear Voice basıldı');

    // 🧼 Yerel tarafı temizle
    clearTranscriptAll();
    speakingQueue = [];
    isSpeaking = false;

    // 📡 Karşı tarafa gönder
    clearRemoteVoiceMessages();
  });
}




