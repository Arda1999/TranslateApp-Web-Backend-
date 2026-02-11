// textToSpeech.js
export async function sendTextToSpeechAPI(text) {
    try {
      const response = await fetch('http://127.0.0.1:5002/text_to_speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text, language: 'en' }),
      });
  
      if (!response.ok) {
        throw new Error('Seslendirme API isteği başarısız oldu');
      }
  
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Seslendirme API çağrısı sırasında hata oluştu:', error);
    }
  }
  
  export async function playAudio(audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
      console.log('Audio is playing');
      return new Promise((resolve) => {
        audio.onended = resolve;
      });
    } catch (error) {
      console.error('Error while playing audio:', error);
    }
  }
  
  export async function playAllTranslations(speakingQueue) {
    let isSpeaking = false;
    if (isSpeaking) return;
    isSpeaking = true;
  
    while (speakingQueue.length > 0) {
      const currentDiv = speakingQueue.shift();
      const translatedDiv = currentDiv.querySelector('.translated-text');
  
      if (translatedDiv) {
        const translatedText = translatedDiv.innerText.replace('Çevirisi: ', '').trim();
        if (translatedText) {
          console.log('Seslendiriliyor:', translatedText);
          const audioUrl = await sendTextToSpeechAPI(translatedText);
          await playAudio(audioUrl);
        }
      }
    }
  
    isSpeaking = false;
  }
  