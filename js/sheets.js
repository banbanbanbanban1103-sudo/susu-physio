// ဆရာမ ပေးထားသော နောက်ဆုံး Deployment URL
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzlSJh7gpXZk-67iUGQffrreo-syIKqcWgVpmCRhTnRzAxdUoaVwYFKhXAk04vdThM/exec";

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
        
        // no-cors ကြောင့် response အဖြေ တိုက်ရိုက်ဖတ်မရသော်လည်း logic အရ true ပြန်ပေးပါသည်
        return true; 
    } catch (error) {
        console.error('Error saving to sheet:', error);
        return false;
    }
}

// ၂။ လူနာကို ကုသမှုပြီးကြောင်း (Complete) သတ်မှတ်ခြင်း
async function markAsComplete(patientName, dateTime) {
    // အတည်ပြုချက် ရယူခြင်း
    if (!confirm(patientName + " အတွက် ကုသမှုပြီးမြောက်ကြောင်း မှတ်တမ်းတင်မလား?")) return;

    if (typeof showToast === "function") showToast('မှတ်တမ်းတင်နေပါသည်...', 'success');

    try {
        // Google Script ဆီသို့ action: 'UPDATE_STATUS' လှမ်းပို့ခြင်း
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                name: patientName,
                datetime: dateTime,
                status: 'Complete',
                action: 'UPDATE_STATUS'
            })
        });

        if (typeof showToast === "function") showToast('မှတ်တမ်းတင်ပြီးပါပြီ');
        
        // Sheet ထဲမှာ data ပြောင်းသွားဖို့ အချိန်ခဏစောင့်ပြီး App data ကို refresh လုပ်ခြင်း
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
    // URL မရှိလျှင် သို့မဟုတ် default ဖြစ်နေလျှင် ရပ်တန့်မည်
    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_GOOGLE")) return;

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            let tempAppointments = []; 

            data.forEach(item => {
                const dtStr = String(item.datetime); 
                // Date format ညှိခြင်း (YYYY-MM-DD)
                let d = dtStr.includes('T') ? dtStr.split('T')[0] : dtStr.substring(0, 10);

                tempAppointments.push({
                    date: d,
                    name: item.name || "Unknown",
                    phone: item.phone || "",
                    address: item.address || "",
                    time: dtStr,
                    type: item.type || "Once",
                    status: item.status || "Active" // Column F မှ Status (Active/Complete)
                });
            });
            
            // Global appointments variable ထဲသို့ ထည့်သွင်းခြင်း
            appointments = tempAppointments;
            
            console.log(`Loaded ${appointments.length} records from sheet.`);

            // Calendar နှင့် Dashboard UI ကို ချက်ချင်း Update လုပ်ရန်
            if (typeof renderCalendar === "function") renderCalendar();
            if (typeof updateDashboardStats === "function") updateDashboardStats();
        }
    } catch (error) {
        console.error('Error fetching data from sheet:', error);
    }
}

// ၄။ App စဖွင့်ချိန် (သို့မဟုတ်) Login အောင်မြင်ချိန်တွင် Data ဆွဲယူရန်
document.addEventListener('DOMContentLoaded', () => {
    // Login ဝင်ထားမှသာ ဒေတာဆွဲယူမည်
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        fetchPatientsFromSheet();
    }
});
