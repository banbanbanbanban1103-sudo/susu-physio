// ၁။ Telegram Configuration (လောလောဆယ် အလွတ်ထားနိုင်သည်)
const TELEGRAM_BOT_TOKEN = ''; 
const TELEGRAM_CHAT_ID = ''; 

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

    showToast('စာရင်းသွင်းနေပါသည်...', 'success');

    try {
        // (က) Telegram သို့ ပို့ခြင်း (Token ရှိမှသာ အလုပ်လုပ်မည်)
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await sendToTelegram(bookingData);
        } else {
            console.log("Telegram Token မရှိသေးသဖြင့် Notification ကို ကျော်လိုက်ပါပြီ။");
        }

        // (ခ) Google Sheet ထဲသို့ Data သိမ်းဆည်းခြင်း
        if (typeof saveDataToSheet === "function") {
            const isSaved = await saveDataToSheet(bookingData);
            
            if (isSaved) {
                showToast('Booking အောင်မြင်ပြီး Sheet ထဲ သိမ်းဆည်းပြီးပါပြီ');
                
                // Form ကို Reset ချပြီး Dashboard သို့ ပြန်သွားခြင်း
                document.getElementById('booking-form').reset();
                
                // Sheet ထဲက data အသစ်ကို ချက်ချင်းပြန်ဆွဲယူခြင်း
                if (typeof fetchPatientsFromSheet === "function") {
                    fetchPatientsFromSheet();
                }

                setTimeout(() => showSection('news'), 2000);
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
    // Token မပါရင် function ထဲက ပြန်ထွက်မည်
    if (!TELEGRAM_BOT_TOKEN) return;

    const formattedDate = new Date(data.datetime).toLocaleString('my-MM');
    const text = `✨ **SU Physio - New Booking** ✨\n━━━━━━━━━━━━━━━━━━\n👤 **လူနာအမည်:** ${data.name}\n📞 **ဖုန်းနံပါတ်:** ${data.phone}\n🏠 **လိပ်စာ:** ${data.address || 'မပါဝင်ပါ'}\n⏰ **ရက်ချိန်း:** ${formattedDate}\n━━━━━━━━━━━━━━━━━━`;

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
        console.warn("Telegram ပို့၍မရပါ - ", e);
    }
}

// ၄။ လူနာဟောင်း ရှာဖွေခြင်း (Search & Auto-fill)
function searchPatient() {
    const query = document.getElementById('p-search').value.toLowerCase();
    
    // အနည်းဆုံး ၂ လုံးရိုက်မှ ရှာမယ်
    if (query.length < 2) return;

    // global appointments array ထဲတွင် ရှာဖွေခြင်း
    if (typeof appointments !== 'undefined' && Array.isArray(appointments)) {
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
