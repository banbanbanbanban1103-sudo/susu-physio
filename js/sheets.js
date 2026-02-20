const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwjRDhjicXQfESKnpcCn26sUdjeP8T0ZVVOppf78JJNFHmNYhRAAMBVy2HSUIuVyXsZ/exec";

// ၁။ Sheet ထဲကို Data အသစ်လှမ်းပို့ခြင်း
async function saveDataToSheet(patientData) {
    try {
        // Telegram Bot မပါသေးဘဲ Sheet ထဲပဲ အရင်ပို့မယ်
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(patientData)
        });
        
        // mode: 'no-cors' သုံးထားရင် response.ok ကို စစ်လို့မရပေမဲ့ 
        // code က ဒီအထိရောက်ရင် ပို့လွှတ်မှု အောင်မြင်တယ်လို့ ယူဆနိုင်ပါတယ်
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
                let d = "";
                let t = "";
                
                // DateTime string ကို Date နဲ့ Time ခွဲထုတ်ခြင်း
                if (item.datetime && typeof item.datetime === 'string') {
                    const parts = item.datetime.split('T');
                    d = parts[0];
                    t = parts[1] || "";
                }

                return {
                    date: d,
                    name: item.name || "Unknown",
                    phone: item.phone || "",
                    address: item.address || "",
                    time: t,
                    status: item.status || "Regular"
                };
            });
            
            // Dashboard နဲ့ Calendar ကို Update လုပ်ခိုင်းမယ်
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
