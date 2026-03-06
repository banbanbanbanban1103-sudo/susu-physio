const SCRIPT_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";

// ၁။ Sheet ထဲကို Data အသစ်လှမ်းပို့ခြင်း
async function saveDataToSheet(patientData) {
    try {
        // patientData ထဲတွင် name, phone, address, datetime, type, status တို့ပါဝင်သည်
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData)
        });
        
        // no-cors ကြောင့် response တိုက်ရိုက်စစ်မရသော်လည်း error မတက်လျှင် true ပြန်ပေးမည်
        return true; 
    } catch (error) {
        console.error('Error saving to sheet:', error);
        return false;
    }
}

// ၂။ Sheet ထဲကနေ Data ပြန်ဖတ်ခြင်း (Weekly Type ပါဝင်သည်)
async function fetchPatientsFromSheet() {
    if (SCRIPT_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
        console.warn("Google Apps Script URL ကို မထည့်ရသေးပါ။");
        return;
    }

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            let tempAppointments = []; 

            data.forEach(item => {
                const dtStr = String(item.datetime); 
                // Date format ညှိခြင်း (YYYY-MM-DD)
                let d = dtStr.includes('T') ? dtStr.split('T')[0] : dtStr.substring(0, 10);

                // စာရင်းအသစ်ထဲသို့ Weekly/Once type ပါ တစ်ခါတည်းထည့်ခြင်း
                tempAppointments.push({
                    date: d,
                    name: item.name || "Unknown",
                    phone: item.phone || "",
                    address: item.address || "",
                    time: dtStr,
                    type: item.type || "Once", // Weekly သို့မဟုတ် Once (Sheet ရဲ့ Column E မှလာမည်)
                    status: item.status || "Active"
                });
            });
            
            // Global appointments ထဲသို့ အားလုံးပေါင်းထည့်ခြင်း
            appointments = tempAppointments;
            
            console.log(`Loaded ${appointments.length} patients including recurring schedules.`);

            // Dashboard နဲ့ Calendar ကို ချက်ချင်း Update လုပ်ခိုင်းခြင်း
            if (typeof renderCalendar === "function") renderCalendar();
            if (typeof updateDashboardStats === "function") updateDashboardStats();
            
        }
    } catch (error) {
        console.error('Error fetching data from sheet:', error);
    }
}

// ၃။ App စဖွင့်ချိန် (သို့မဟုတ်) Login အောင်မြင်ချိန်တွင် Data ဆွဲယူရန်
document.addEventListener('DOMContentLoaded', () => {
    // sessionStorage စစ်ဆေးပြီး Login ဝင်ထားမှ ဒေတာဆွဲရန်
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        fetchPatientsFromSheet();
    }
});
