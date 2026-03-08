// ဆရာမရဲ့ Deployment URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxesy603kpIANMe8NNVHaZGpz1ZqKkUOeNar4YqEeHnDeMqYOwLsgSQveDmKlgndEgf/exec";

// ၁။ Sheet ထဲကို Data အသစ်လှမ်းပို့ခြင်း (Booking အသစ်တင်ခြင်း)
async function saveDataToSheet(patientData) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData)
        });

        // ✅ Booking တင်ပြီးနောက် UI မှာ ချက်ချင်းပေါ်လာစေရန် Data အသစ်ပြန်ဆွဲခိုင်းသည်
        setTimeout(() => {
            fetchPatientsFromSheet();
            if (typeof showSection === "function") showSection('dashboard');
        }, 1500);

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
        
        setTimeout(() => {
            fetchPatientsFromSheet();
        }, 1000);

    } catch (error) {
        console.error('Update error:', error);
        if (typeof showToast === "function") showToast('အမှားအယွင်းရှိပါသည်', 'error');
    }
}

// ၃။ Sheet ထဲကနေ Data ပြန်ဖတ်ခြင်း
async function fetchPatientsFromSheet() {
    // URL မရှိလျှင်သော်လည်းကောင်း၊ Default ဖြစ်နေလျှင်သော်လည်းကောင်း Calendar ကိုတော့ ဆွဲခိုင်းရမည်
    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_GOOGLE")) {
        if (typeof renderCalendar === "function") renderCalendar();
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
            let tempAppointments = []; 

            data.forEach(item => {
                // ✅ ရက်စွဲ Format ပြင်ဆင်ခြင်း
                let dtStr = item.datetime ? String(item.datetime).trim() : "";
                if (dtStr.includes(' ') && !dtStr.includes('T')) {
                    dtStr = dtStr.replace(' ', 'T');
                }

                let d = dtStr.includes('T') ? dtStr.split('T')[0] : dtStr.substring(0, 10);

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
            console.log(`Loaded ${appointments.length} records.`, appointments);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    } finally {
        // ✅ အရေးကြီးဆုံးအချက် - Data ရသည်ဖြစ်စေ၊ မရသည်ဖြစ်စေ Calendar ကို အမြဲပြန်ဆွဲခိုင်းသည်
        // ဒါမှ Calendar ရက်စွဲတွေ ပျောက်မသွားမှာပါ
        if (typeof renderCalendar === "function") renderCalendar();
        if (typeof updateDashboardStats === "function") updateDashboardStats();
    }
}

// ၄။ App စဖွင့်ချိန်တွင် Data ဆွဲယူရန်
document.addEventListener('DOMContentLoaded', () => {
    // Login ဝင်ထားလျှင် Data ဆွဲမည်၊ မဝင်ထားလျှင်လည်း Calendar အလွတ်ကို ဆွဲပေးမည်
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        fetchPatientsFromSheet();
    } else {
        if (typeof renderCalendar === "function") renderCalendar();
    }
});