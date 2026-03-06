// ၁။ Telegram Configuration
const TELEGRAM_BOT_TOKEN = ''; 
const TELEGRAM_CHAT_ID = ''; 

// ၂။ Booking ပြုလုပ်ခြင်း Logic
async function handleBooking() {
    const name = document.getElementById('p-name').value;
    const phone = document.getElementById('p-phone').value;
    const address = document.getElementById('p-address').value;
    const datetime = document.getElementById('p-time').value;
    
    // Weekly Checkbox logic (Index.html ထဲရှိ id နှင့် ကိုက်ညီရမည်)
    const isWeekly = document.getElementById('p-weekly').checked;

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
        type: isWeekly ? 'Weekly' : 'Once', // အပတ်စဉ်လား၊ တစ်ခါတည်းလား
        status: 'Active'
    };

    showToast('စာရင်းသွင်းနေပါသည်...', 'success');

    try {
        // (က) Google Sheet ထဲသို့ Data သိမ်းဆည်းခြင်း (အရင်လုပ်ဆောင်သည်)
        if (typeof saveDataToSheet === "function") {
            const isSaved = await saveDataToSheet(bookingData);
            
            if (isSaved) {
                // (ခ) Telegram သို့ Notification ပို့ခြင်း
                if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
                    await sendToTelegram(bookingData);
                }

                showToast('Booking အောင်မြင်ပြီး Calendar ညှိပြီးပါပြီ');
                
                // Form ကို Reset ချခြင်း
                document.getElementById('booking-form').reset();
                
                // ဒေတာအသစ်ကို ပြန်ဆွဲပြီး Calendar နှင့် Dashboard ကို Update လုပ်ခြင်း
                if (typeof fetchPatientsFromSheet === "function") {
                    await fetchPatientsFromSheet();
                }

                // ၂ စက္ကန့်အကြာတွင် Dashboard (သို့) Calendar သို့ ပြောင်းမည်
                setTimeout(() => showSection('calendar'), 1500);
            } else {
                showToast('Sheet ထဲသိမ်းရာတွင် အခက်အခဲရှိနေသည်', 'error');
            }
        }

    } catch (error) {
        console.error('Booking error:', error);
        showToast('လုပ်ဆောင်မှု မအောင်မြင်ပါ', 'error');
    }
}

// ၃။ Telegram API သို့ Message ပို့ခြင်း
async function sendToTelegram(data) {
    if (!TELEGRAM_BOT_TOKEN) return;

    // ရက်စွဲနှင့် အချိန်ကို ဖတ်ရလွယ်အောင် ပြင်ခြင်း
    const dateObj = new Date(data.datetime);
    const formattedDate = dateObj.toLocaleDateString('my-MM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = dateObj.toLocaleTimeString('my-MM', { hour: '2-digit', minute: '2-digit' });
    
    // Weekly ဖြစ်ပါက Message တွင် ထည့်ပြရန်
    const typeLabel = data.type === 'Weekly' ? '🔄 အပတ်စဉ် (Weekly)' : '📍 တစ်ကြိမ်တည်း (Once)';

    const text = `✨ **SU Physio - New Booking** ✨\n` +
                 `━━━━━━━━━━━━━━━━━━\n` +
                 `👤 **လူနာအမည်:** ${data.name}\n` +
                 `📞 **ဖုန်းနံပါတ်:** ${data.phone}\n` +
                 `🏠 **လိပ်စာ:** ${data.address || 'မပါဝင်ပါ'}\n` +
                 `📅 **ရက်စွဲ:** ${formattedDate}\n` +
                 `⏰ **အချိန်:** ${formattedTime}\n` +
                 `📝 **အမျိုးအစား:** ${typeLabel}\n` +
                 `━━━━━━━━━━━━━━━━━━`;

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: text,
                parse_mode: 'Markdown'
            })
        });
    } catch (e) {
        console.warn("Telegram Notification Error: ", e);
    }
}

// ၄။ လူနာဟောင်း ရှာဖွေခြင်း (Search & Auto-fill)
function searchPatient() {
    const query = document.getElementById('p-search').value.toLowerCase();
    if (query.length < 2) return;

    if (typeof appointments !== 'undefined' && Array.isArray(appointments)) {
        // အမည် သို့မဟုတ် ဖုန်းဖြင့် ရှာဖွေခြင်း
        const found = appointments.find(p => 
            p.name.toLowerCase().includes(query) || (p.phone && p.phone.includes(query))
        );

        if (found) {
            document.getElementById('p-name').value = found.name;
            document.getElementById('p-phone').value = found.phone || '';
            document.getElementById('p-address').value = found.address || '';
            
            showToast(`${found.name} ၏ အချက်အလက်များ ဖြည့်ပြီးပါပြီ`, 'success');
        }
    }
}
