// ၁။ Telegram Configuration (Token ရှိမှသာ အလုပ်လုပ်မည်)
const TELEGRAM_BOT_TOKEN = ''; 
const TELEGRAM_CHAT_ID = ''; 

// ၂။ Booking ပြုလုပ်ခြင်း Logic
async function handleBooking() {
    const name = document.getElementById('p-name').value;
    const phone = document.getElementById('p-phone').value;
    const address = document.getElementById('p-address').value;
    const datetime = document.getElementById('p-datetime').value; // id မှန်အောင် ပြင်ထားသည်

    // Validation စစ်ဆေးခြင်း
    if (!name || !phone || !datetime) {
        showToast('အမည်၊ ဖုန်းနှင့် အချိန်ကို ပြည့်စုံစွာဖြည့်ပါ', 'error');
        return;
    }

    // Sheet ထဲကို Row အသစ်အနေနဲ့ ရောက်သွားဖို့ data အစုအဝေး
    const bookingData = {
        name: name,
        phone: phone,
        address: address,
        datetime: datetime,
        status: 'Regular'
    };

    showToast('စာရင်းသွင်းနေပါသည်...', 'success');

    try {
        // (က) Telegram သို့ ပို့ခြင်း
        if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
            await sendToTelegram(bookingData);
        }

        // (ခ) Google Sheet ထဲသို့ Data သိမ်းဆည်းခြင်း
        if (typeof saveDataToSheet === "function") {
            const isSaved = await saveDataToSheet(bookingData);
            
            if (isSaved) {
                showToast('Booking အသစ် အောင်မြင်ပါသည်');
                
                // Form ကို Reset ချခြင်း (ဒါမှ ဒေတာဟောင်းတွေနဲ့ မရောမှာပါ)
                document.getElementById('booking-form').reset();
                
                // Calendar နှင့် Dashboard ကို ချက်ချင်း Update ဖြစ်စေရန်
                if (typeof fetchPatientsFromSheet === "function") {
                    // await လုပ်ပြီး data အကုန်ဝင်အောင် စောင့်ခေါ်ခြင်း
                    await fetchPatientsFromSheet();
                }

                // ခဏနေလျှင် Dashboard (သို့) News ဆီ ပြန်သွားမည်
                setTimeout(() => showSection('news'), 1500);
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

    // Calendar မှာပြင်ခဲ့သလိုပဲ လူနားလည်တဲ့ အချိန်ပုံစံပြောင်းရန်
    const displayTime = (typeof formatTime === 'function') ? formatTime(data.datetime) : data.datetime;
    
    const text = `✨ **SU Physio - New Booking** ✨\n━━━━━━━━━━━━━━━━━━\n👤 **လူနာအမည်:** ${data.name}\n📞 **ဖုန်းနံပါတ်:** ${data.phone}\n🏠 **လိပ်စာ:** ${data.address || 'မပါဝင်ပါ'}\n⏰ **ရက်ချိန်း:** ${data.datetime.split('T')[0]} (${displayTime})\n━━━━━━━━━━━━━━━━━━`;

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
        console.warn("Telegram ပို့၍မရပါ");
    }
}

// ၄။ လူနာဟောင်း ရှာဖွေခြင်း (Search & Auto-fill)
// ဒီနေရာမှာ Regular လူနာဆိုရင် အမည်နဲ့ ဖုန်းပဲ ဖြည့်ပေးမှာဖြစ်ပြီး ရက်စွဲက အသစ်ဖြစ်နေပါလိမ့်မယ်
function searchPatient() {
    const query = document.getElementById('p-search').value.toLowerCase();
    
    if (query.length < 2) return;

    if (typeof appointments !== 'undefined' && Array.isArray(appointments)) {
        const found = appointments.find(p => 
            p.name.toLowerCase().includes(query) || (p.phone && p.phone.includes(query))
        );

        if (found) {
            document.getElementById('p-name').value = found.name;
            document.getElementById('p-phone').value = found.phone || '';
            document.getElementById('p-address').value = found.address || '';
            
            // ရက်စွဲဟောင်းကို မဖြည့်ဘဲ အသစ်ရွေးခိုင်းရန် Clear လုပ်ထားမည်
            document.getElementById('p-datetime').value = '';
            
            showToast(`${found.name} ၏ အချက်အလက်များ ဖြည့်ပြီးပါပြီ။ ရက်စွဲနှင့် အချိန် အသစ်ရွေးပေးပါ။`, 'success');
        }
    }
}
