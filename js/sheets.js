const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwjRDhjicXQfESKnpcCn26sUdjeP8T0ZVVOppf78JJNFHmNYhRAAMBVy2HSUIuVyXsZ/exec";

// ၁။ Sheet ထဲကို Data အသစ်လှမ်းပို့ခြင်း
async function saveDataToSheet(patientData) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
        
        // ပို့လွှတ်မှု အောင်မြင်လျှင် true ပြန်ပေးမည်
        return true;
    } catch (error) {
        console.error('Error saving to sheet:', error);
        return false;
    }
}

// ၂။ Sheet ထဲကနေ Data ပြန်ဖတ်ခြင်း (Calendar & Search အတွက်)
async function fetchPatientsFromSheet() {
    if (SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") return;

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            // Global appointments array ကို update လုပ်ခြင်း
            appointments = data.map(item => {
                // အချိန်လွဲချော်မှုမရှိစေရန် String အဖြစ် အရင်ပြောင်းပါသည်
                const dtStr = String(item.datetime); 
                
                let d = "";
                // ISO format (2026-02-21T09:00:00.000Z) ထဲမှ ရက်စွဲကိုပဲ ခွဲထုတ်ခြင်း
                if (dtStr.includes('T')) {
                    d = dtStr.split('T')[0];
                } else {
                    d = dtStr;
                }

                return {
                    date: d, // Calendar မှာ အစက်လေးတွေပြဖို့ ရက်စွဲသီးသန့်
                    name: item.name || "Unknown",
                    phone: item.phone || "",
                    address: item.address || "",
                    time: dtStr, // formatTime() သုံးရန် DateTime String တစ်ခုလုံးပို့ပေးခြင်း
                    status: item.status || "Regular"
                };
            });
            
            // Dashboard နဲ့ Calendar ကို Update လုပ်ခြင်း
            if (typeof renderCalendar === "function") renderCalendar();
            if (typeof updateDashboardStats === "function") updateDashboardStats();
            
            console.log("Data fetched successfully from Sheet");
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// ၃။ App စဖွင့်ချိန်မှာ Data ဆွဲယူမယ်
document.addEventListener('DOMContentLoaded', () => {
    fetchPatientsFromSheet();
});
