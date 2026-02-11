const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

let users = {};  // Kullanıcı kimliklerini ve bağlantılarını saklayan nesne
let userDevices = {};  // Kullanıcıların cihaz tiplerini saklayan nesne
const userNames = new Map();  // Kullanıcıların adlarını saklayan Map
let activeConnections = {};  // Kabul edilen bağlantıları saklayan nesne

wss.on('connection', (ws) => {
    console.log('Yeni bir kullanıcı bağlandı');
    const userId = generateUserId();
    users[userId] = ws;
    
    ws.send(JSON.stringify({ type: 'user_id', userId }));
    broadcastUsers();

    ws.on('message', (data) => {
        const message = JSON.parse(data);
        console.log('📨 Gelen mesaj:', message.type, message);

        // Kullanıcı adı güncellemesi (web ve mobil için)
        if (message.type === 'update_username' || message.type === 'update_name') {
            const newName = message.username || message.userName || message.name;
            const oldName = userNames.get(message.userId) || 'Misafir';
            userNames.set(message.userId, newName);
            console.log(`👤 Kullanıcı adı güncellendi: "${oldName}" → "${newName}" (ID: ${message.userId})`);
            console.log(`📡 Tüm kullanıcılara güncelleme yayınlanıyor (${Object.keys(users).length} kullanıcı)...`);
            broadcastUsers();
            return;
        }

        // Cihaz bilgisini kaydet
        if (message.type === 'device_info') {
            userDevices[message.userId] = message.deviceType;
            // userName varsa kaydet (mobil ve web için farklı alan isimleri destekleniyor)
            const userName = message.userName || message.username || message.name;
            if (userName) {
                userNames.set(message.userId, userName);
                console.log(`📱 Cihaz bilgisi kaydedildi: ${message.userId} → ${message.deviceType} (İsim: ${userName})`);
            } else {
                userNames.set(message.userId, 'Misafir');
                console.log(`📱 Cihaz bilgisi kaydedildi: ${message.userId} → ${message.deviceType} (İsim yok, Misafir olarak kaydedildi)`);
            }
            broadcastUsers();
            return;
        }

        if (message.type === 'connect_request') {
            const { targetUserId } = message;
            console.log(`📞 Bağlantı isteği: ${userId} → ${targetUserId}`);
            if (users[targetUserId]) {
                users[targetUserId].send(JSON.stringify({
                    type: 'connect_request',
                    fromUserId: userId,
                    fromUsername: userNames.get(userId) || userId
                }));
                console.log(`✅ İstek ${targetUserId} kullanıcısına gönderildi`);
            } else {
                console.log(`❌ Hedef kullanıcı bulunamadı: ${targetUserId}`);
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Hedef kullanıcı bulunamadı veya çevrimdışı'
                }));
            }
        }

        if (message.type === 'connect_response') {
            const { fromUserId, accepted } = message;
            console.log(`📩 Bağlantı yanıtı alındı:`);
            console.log(`   - Yanıt veren: ${userId}`);
            console.log(`   - İstek gönderen: ${fromUserId}`);
            console.log(`   - Kabul durumu: ${accepted}`);
            console.log(`   - Kabul durumu tipi: ${typeof accepted}`);
            
            // Boolean veya "true" string'ini kabul et
            const isAccepted = accepted === true || accepted === 'true';
            
            if (isAccepted) {
                // İki yönlü bağlantı kur
                activeConnections[fromUserId] = userId;
                activeConnections[userId] = fromUserId;
                console.log(`✅ Bağlantı kuruldu: ${fromUserId} ↔ ${userId}`);

                // İstek gönderen tarafa bağlantının kurulduğunu bildir
                if (users[fromUserId]) {
                    users[fromUserId].send(JSON.stringify({
                        type: 'connect_confirmed',
                        targetUserId: userId,
                        targetUsername: userNames.get(userId) || userId,
                        message: 'Bağlantı başarıyla kuruldu!'
                    }));
                }

                // Onaylayan tarafa da bağlantının kurulduğunu bildir
                ws.send(JSON.stringify({
                    type: 'connect_confirmed',
                    targetUserId: fromUserId,
                    targetUsername: userNames.get(fromUserId) || fromUserId,
                    message: 'Bağlantı başarıyla kuruldu!'
                }));
            } else {
                // Red edildiğinde istek gönderen tarafa bildir
                if (users[fromUserId]) {
                    users[fromUserId].send(JSON.stringify({
                        type: 'connect_rejected',
                        targetUserId: userId,
                        targetUsername: userNames.get(userId) || userId,
                        message: 'Bağlantı isteğiniz reddedildi'
                    }));
                }
                console.log(`❌ Bağlantı reddedildi: ${fromUserId} ✗ ${userId}`);
            }
        }

        // Ses verisi gönderimi (sadece onaylanmış bağlantılar arasında)
        if (message.type === 'audio') {
            const { audioData, targetUserId } = message;
            if (users[targetUserId] && activeConnections[userId] === targetUserId) {
                users[targetUserId].send(JSON.stringify({ type: 'audio', audioData }));
            }
        }

        // Sesli mesajları temizle komutu
        if (message.type === 'clear_voice') {
            const { targetUserId } = message;
            console.log(`🧹 Ses temizleme komutu alındı: ${userId} → ${targetUserId}`);
            if (users[targetUserId] && activeConnections[userId] === targetUserId) {
                users[targetUserId].send(JSON.stringify({ 
                    type: 'clear_voice_received',
                    fromUserId: userId
                }));
                console.log(`✅ Temizleme komutu ${targetUserId} kullanıcısına gönderildi`);
            } else {
                console.log(`❌ Hedef kullanıcı bulunamadı veya bağlantı yok: ${targetUserId}`);
            }
        }

        // Bağlantıyı kes komutu
        if (message.type === 'disconnect') {
            const { targetUserId } = message;
            console.log(`🔌 Bağlantı kesme isteği alındı: ${userId} → ${targetUserId}`);
            
            // İki yönlü bağlantıyı temizle
            if (activeConnections[userId] === targetUserId) {
                delete activeConnections[userId];
                delete activeConnections[targetUserId];
                console.log(`✅ Bağlantı silindi: ${userId} ↔ ${targetUserId}`);
                
                // Karşı tarafa bildirim gönder
                if (users[targetUserId]) {
                    users[targetUserId].send(JSON.stringify({
                        type: 'disconnected',
                        fromUserId: userId,
                        fromUsername: userNames.get(userId) || userId,
                        message: 'Bağlantı kesildi'
                    }));
                    console.log(`📢 ${targetUserId} kullanıcısına bağlantı kesme bildirimi gönderildi`);
                }
            } else {
                console.log(`⚠️ Bağlantı bulunamadı: ${userId} ↔ ${targetUserId}`);
            }
        }
    });

    ws.on('close', () => {
        console.log(`Kullanıcı (${userId}) bağlantıyı kesti`);
        delete users[userId];
        delete userDevices[userId];
        userNames.delete(userId);
        delete activeConnections[userId];
        broadcastUsers();
    });
});

function broadcastUsers() {
    const userList = Object.keys(users).map(userId => ({
        id: userId,
        deviceType: userDevices[userId] || '💻 PC',
        username: userNames.get(userId) || 'Misafir'  // Map'ten al, yoksa Misafir
    }));
    
    console.log('📢 Kullanıcı listesi yayınlanıyor:');
    userList.forEach(u => {
        console.log(`   👤 ${u.username} (${u.id}) ${u.deviceType}`);
    });
    
    const message = JSON.stringify({ type: 'user_list', users: userList });
    let sentCount = 0;
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
            sentCount++;
        }
    });
    console.log(`✅ ${sentCount} istemciye gönderildi\n`);
}

function generateUserId() {
    return Math.random().toString(36).substr(2, 9);
}
