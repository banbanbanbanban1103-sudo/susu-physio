const SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

// ၁။ Sheet ထဲကို Data အသစ်လှမ်းပို့ခြင်း
async function saveDataToSheet(patientData) {
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Apps Script အတွက် no-cors သုံးရလေ့ရှိပါတယ်
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(patientData)
        });
        
        return true;
    } catch (error) {
        console.error('Error saving to sheet:', error);
        return false;
    }
}

// ၂။ Sheet ထဲကနေ Data ပြန်ဖတ်ခြင်း (Calendar အတွက်)
async function fetchPatientsFromSheet() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        // Calendar မှာသုံးနေတဲ့ appointments array ထဲကို update လုပ်မယ်
        if (Array.isArray(data)) {
            appointments = data.map(item => ({
                date: item.datetime.split('T')[0], // YYYY-MM-DD format ယူခြင်း
                name: item.name,
                time: item.datetime.split('T')[1],
                status: item.status
            }));
            
            // Calendar ကို ပြန်ဆွဲမယ်
            if (typeof renderCalendar === "function") {
                renderCalendar();
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// ၃။ ပထမဆုံး စဖွင့်ချိန်မှာ Data ဆွဲယူမယ်
document.addEventListener('DOMContentLoaded', () => {
    // URL ထည့်ထားမှ ခေါ်မယ်
    if (SCRIPT_URL !== "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
        fetchPatientsFromSheet();
    }
});
