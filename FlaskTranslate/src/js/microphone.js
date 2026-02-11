// microphone.js
export async function listMicrophones() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const microphones = devices.filter(device => device.kind === "audioinput");
  
      if (microphones.length === 0) {
        console.warn("Herhangi bir mikrofon bulunamadı.");
        return [];
      }
  
      console.log("🔊 Mevcut Mikrofonlar:");
      microphones.forEach((mic, index) => console.log(`${index + 1}: ${mic.label} (ID: ${mic.deviceId})`));
  
      return microphones;
    } catch (error) {
      console.error("Mikrofonları listeleme hatası:", error);
      return [];
    }
  }
  
 
  // microphone.js
export async function changeMicrophone(index) {
  try {
    // API host'u otomatik seç - Sayfayı hangi adresten açıyorsan o adresi kullan
    const currentHost = window.location.hostname;
    const currentProtocol = window.location.protocol;
    const API_HOST = `${currentProtocol}//${currentHost}`;
    
    const response = await fetch(`${API_HOST}:3005/change-microphone/${index}`);
    if (!response.ok) {
      console.warn(`⚠️ Mikrofon değiştirme servisi erişilemez (${response.status}) - Varsayılan mikrofon kullanılacak`);
      return false;
    }
    const data = await response.text();
    console.log('✅ Mikrofon değiştirildi:', data);
    return true;
  } catch (error) {
    console.warn('⚠️ Mikrofon değiştirme servisi erişilemez - Mobil/Remote cihazda varsayılan mikrofon kullanılacak:', error.message);
    return false; // Hata vermeden devam et
  }
}


  