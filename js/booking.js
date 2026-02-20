// ၁။ Telegram Configuration
const TELEGRAM_BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const TELEGRAM_CHAT_ID = 'YOUR_CHAT_ID_HERE';

// ၂။ Booking ပြုလုပ်ခြင်း Logic
async function handleBooking() {
    const name = document.getElementById('p-name').value;
    const phone = document.getElementById('p-phone').value;
    const address = document.getElementById('p-address').value;
    const datetime = document.getElementById('p-time').value;

    // Validation စစ်ဆေးခြင်း
    if (!name || !phone || !datetime) {
        showToast('အမည်၊ ဖုန်းနှင့် အချိန်ကို ပြည့်စုံစွာဖြည့်ပါ', 'error');
        return;
    }

    const bookingData = {
        name: name,
        phone: phone,
        address: address,
        datetime: datetime,
        status: 'Regular'
    };

    // UI မှာ loading ပြရန်
    showToast('Booking တင်နေပါသည်...', 'success');

    try {
        // (က) Telegram သို့ အကြောင်းကြားစာပို့ခြင်း
        await sendToTelegram(bookingData);

        // (ခ) Google Sheet ထဲသို့ Data သိမ်းဆည်းခြင်း (sheets.js ထဲက function ကိုခေါ်တာပါ)
        if (typeof saveDataToSheet === "function") {
            await saveDataToSheet(bookingData);
        }

        showToast('Booking အောင်မြင်ပြီး Telegram သို့ ပို့ပြီးပါပြီ');
        
        // Form ကို Reset ချပြီး News section သို့ ပြန်သွားခြင်း
        document.getElementById('booking-form').reset();
        setTimeout(() => showSection('news'), 2000);

    } catch (error) {
        console.error('Booking error:', error);
        showToast('ပို့ဆောင်မှု မအောင်မြင်ပါ', 'error');
    }
}

// ၃။ Telegram API သို့ Message ပို့ခြင်း
async function sendToTelegram(data) {
    const formattedDate = new Date(data.datetime).toLocaleString();
    
    const text = `
✨ **SU Physio - New Booking** ✨
━━━━━━━━━━━━━━━━━━
👤 **လူနာအမည်:** ${data.name}
📞 **ဖုန်းနံပါတ်:** ${data.phone}
🏠 **လိပ်စာ:** ${data.address || 'မပါဝင်ပါ'}
⏰ **ရက်ချိန်း:** ${formattedDate}
━━━━━━━━━━━━━━━━━━
    `;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: text,
            parse_mode: 'Markdown'
        })
    });

    if (!response.ok) throw new Error('Telegram API error');
}

// ၄။ လူနာဟောင်း ရှာဖွေခြင်း (Search & Auto-fill)
function searchPatient() {
    const query = document.getElementById('p-search').value.toLowerCase();
    
    // အနည်းဆုံး ၃ လုံးရိုက်မှ ရှာမယ်
    if (query.length < 3) return;

    // appointments array ထဲမှာ ရှာဖွေခြင်း (calendar.js သို့မဟုတ် sheets.js ကလာတဲ့ data)
    const found = appointments.find(p => 
        p.name.toLowerCase().includes(query) || p.phone.includes(query)
    );

    if (found) {
        // ရှာတွေ့ရင် Form ထဲကို Data ထည့်ပေးမယ်
        document.getElementById('p-name').value = found.name;
        document.getElementById('p-phone').value = found.phone || '';
        document.getElementById('p-address').value = found.address || '';
        
        showToast(`${found.name} ၏ အချက်အလက်များကို ဖြည့်ပြီးပါပြီ`);
    }
}
