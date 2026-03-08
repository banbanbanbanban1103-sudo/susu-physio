// ဆရာမရဲ့ Deployment URL ကို ဒီမှာသေချာထည့်ပါ
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxesy603kpIANMe8NNVHaZGpz1ZqKkUOeNar4YqEeHnDeMqYOwLsgSQveDmKlgndEgf/exec";

// ၁။ Sheet ထဲကို Data အသစ်လှမ်းပို့ခြင်း (Booking အသစ်တင်ခြင်း)
// FIX: no-cors မှာ response မဖတ်နိုင်သောကြောင့် POST ပို့ပြီး ၂ စက္ကန့်နောက် GET ဖြင့် data ပြန်ဆွဲမည်
async function saveDataToSheet(patientData) {
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patientData)
        });
        // no-cors မှာ response body မဖတ်နိုင်သောကြောင့် POST success ဟုမှတ်ယူမည်
        return true;
    } catch (error) {
        console.error('Error saving to sheet:', error);
        return false;
    }
}

// ၂။ လူနာကို ကုသမှုပြီးကြောင်း (Complete) သတ်မှတ်ခြင်း
async function markAsComplete(patientName, dateTime) {
    if (!confirm(patientName + " အတွက် ယနေ့ကုသမှုပြီးမြောက်ကြောင်း မှတ်တမ်းတင်မလား?")) return;

    if (typeof showToast === "function") showToast('မှတ်တမ်းတင်နေပါသည်...', 'success');

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                name: patientName,
                datetime: dateTime,
                action: 'UPDATE_STATUS'
            })
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const doneKey = `done_${patientName}_${dateTime}_${todayStr}`;
        sessionStorage.setItem(doneKey, 'true');

        if (typeof showToast === "function") showToast('မှတ်တမ်းတင်ပြီးပါပြီ');
        
        // Sheet update ဖြစ်ဖို့ ၁.၅ စက္ကန့် စောင့်ပြီးမှ ပြန်ဆွဲမည်
        setTimeout(() => {
            fetchPatientsFromSheet();
        }, 1500);

    } catch (error) {
        console.error('Update error:', error);
        if (typeof showToast === "function") showToast('အမှားအယွင်းရှိပါသည်', 'error');
    }
}

// ၃။ Sheet ထဲကနေ Data ပြန်ဖတ်ခြင်း
// FIX: Date ကို Myanmar time zone (UTC+6:30) ဖြင့် တွက်ချက်ခြင်း + cache bust
async function fetchPatientsFromSheet() {
    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_GOOGLE")) return;

    try {
        const response = await fetch(SCRIPT_URL + "?t=" + Date.now());
        const data = await response.json();
        
        if (Array.isArray(data)) {
            let tempAppointments = [];

            data.forEach(item => {
                const dtStr = String(item.datetime);
                
                // FIX: Myanmar time (UTC+6:30) ဖြင့် date extract လုပ်ခြင်း
                let d;
                if (dtStr.includes('T')) {
                    // UTC datetime → Myanmar date ပြောင်းခြင်း
                    const utcMs = new Date(dtStr).getTime();
                    const mmMs = utcMs + (6.5 * 60 * 60 * 1000);
                    const mmDate = new Date(mmMs);
                    d = mmDate.toISOString().split('T')[0];
                } else if (dtStr.includes(' ')) {
                    d = dtStr.split(' ')[0];
                } else {
                    d = dtStr.substring(0, 10);
                }

                tempAppointments.push({
                    date: d,
                    name: item.name || "Unknown",
                    phone: item.phone || "",
                    address: item.address || "",
                    time: dtStr,
                    type: item.type || "Once",
                    status: item.status || "Active",
                    count: item.count || 0
                });
            });
            
            appointments = tempAppointments;
            console.log(`Loaded ${appointments.length} records.`);

            if (typeof renderCalendar === "function") renderCalendar();
            if (typeof updateDashboardStats === "function") updateDashboardStats();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// ၄။ App စဖွင့်ချိန်တွင် Data ဆွဲယူရန်
// FIX: setTimeout 300ms ထည့်ပြီး DOM + JS files အားလုံး load ပြီးမှ ဆွဲမည်
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        setTimeout(() => {
            fetchPatientsFromSheet();
        }, 300);
    }
});
