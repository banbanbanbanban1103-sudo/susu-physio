const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwjRDhjicXQfESKnpcCn26sUdjeP8T0ZVVOppf78JJNFHmNYhRAAMBVy2HSUIuVyXsZ/exec";

// ၁။ Sheet ထဲကို Data အသစ်လှမ်းပို့ခြင်း
async function saveDataToSheet(patientData) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Google Apps Script အတွက် လိုအပ်နိုင်သည်
            cache: 'no-cache',
            body: JSON.stringify(patientData)
        });
        
        // no-cors ကြောင့် response check လုပ်မရသော်လည်း 
        // ခြွင်းချက်အနေနဲ့ true ပြန်ပေးပါမည်
        return true; 
    } catch (error) {
        console.error('Error saving to sheet:', error);
        return false;
    }
}

// ၂။ Sheet ထဲကနေ Data ပြန်ဖတ်ခြင်း (ရက်ချိန်းအားလုံးကို အကုန်ယူရန်)
async function fetchPatientsFromSheet() {
    if (SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") return;

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            // အရင်အချက်အလက်ဟောင်းတွေကို ရှင်းထုတ်ပြီး Array အသစ်တည်ဆောက်ခြင်း
            // ဒါမှ အမည်တူလူနာ ထပ်လာရင် overwrite မဖြစ်မှာပါ
            let tempAppointments = []; 

            data.forEach(item => {
                const dtStr = String(item.datetime); 
                let d = dtStr.includes('T') ? dtStr.split('T')[0] : dtStr.substring(0, 10);

                // စာရင်းအသစ်ထဲသို့ တစ်ခုချင်းစီ ထည့်သွင်းခြင်း
                tempAppointments.push({
                    date: d,
                    name: item.name || "Unknown",
                    phone: item.phone || "",
                    address: item.address || "",
                    time: dtStr,
                    status: item.status || "Regular"
                });
            });
            
            // Global appointments ထဲသို့ အားလုံးပေါင်းထည့်လိုက်ခြင်း
            appointments = tempAppointments;
            
            console.log(`Total appointments loaded: ${appointments.length}`);

            // Dashboard နဲ့ Calendar ကို Update လုပ်ခြင်း
            if (typeof renderCalendar === "function") renderCalendar();
            if (typeof updateDashboardStats === "function") updateDashboardStats();
            
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// ၃။ App စဖွင့်ချိန်မှာ Data ဆွဲယူမယ်
document.addEventListener('DOMContentLoaded', () => {
    fetchPatientsFromSheet();
});
