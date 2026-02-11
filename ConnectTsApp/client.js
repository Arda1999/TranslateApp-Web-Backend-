const dgram = require('dgram');
const fs = require('fs');

// 5009 portuna mesaj gönderme (MP3 dosyası)
const sendTo5009 = (filePath) => {
    const client = dgram.createSocket('udp4');
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Dosya okunamadı: ${err}`);
            return;
        }

        client.send(data, 0, data.length, 5009, '127.0.0.1', (err) => {
            if (err) console.error(err);
            console.log(`5009 portuna MP3 dosyası gönderildi: ${filePath}`);
            client.close();
        });
    });
};

// 5010 portuna mesaj gönderme (MP3 dosyası)
const sendTo5010 = (filePath) => {
    const client = dgram.createSocket('udp4');

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Dosya okunamadı: ${err}`);
            return;
        }

        client.send(data, 0, data.length, 5010, '127.0.0.1', (err) => {
            if (err) console.error(err);
            console.log(`5010 portuna MP3 dosyası gönderildi: ${filePath}`);
            client.close();
        });
    });
};

// MP3 dosyalarını gönder
setTimeout(() => {
    sendTo5009('mp3_1.mp3'); // 5009 portuna mp3_1'i gönder
}, 1000);

setTimeout(() => {
    sendTo5010('mp3_2.mp3'); // 5010 portuna mp3_2'yi gönder
}, 2000);
