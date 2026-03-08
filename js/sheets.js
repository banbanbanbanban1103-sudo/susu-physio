const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby0OxKn-Rrwqcrx-GxYHAUSI_yJ_uZOYtOlirL_OZjy9g7WZKpYc0uEVM3fTtB7d9oE/exec";

// ၁။ Sheet ထဲကို Data အသစ်လှမ်းပို့ခြင်း
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
        
        return true; 
    } catch (error) {
        console.error('Error saving to sheet:', error);
        return false;
    }
}

// ၂။ လူနာကို ကုသမှုပြီးကြောင်း (Complete) သတ်မှတ်ခြင်း
async function markAsComplete(patientName, dateTime) {
    if (!confirm(patientName + " အတွက် ကုသမှုပြီးမြောက်ကြောင်း မှတ်တမ်းတင်မလား?")) return;

    if (typeof showToast === "function") showToast('မှတ်တမ်းတင်နေပါသည်...', 'success');

    try {
        // action: 'UPDATE_STATUS' ကိုသုံးပြီး Google Script ဆီ ပို့သည်
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
        
        // ဒေတာအသစ်ကို Sheet မှ ချက်ချင်းပြန်ဆွဲယူသည်
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
    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_GOOGLE")) return;

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        if (Array.isArray(data)) {
            let tempAppointments = []; 

            data.forEach(item => {
                const dtStr = String(item.datetime); 
                let d = dtStr.includes('T') ? dtStr.split('T')[0] : dtStr.substring(0, 10);

                tempAppointments.push({
                    date: d,
                    name: item.name || "Unknown",
                    phone: item.phone || "",
                    address: item.address || "",
                    time: dtStr,
                    type: item.type || "Once",
                    status: item.status || "Active" // Column F မှ ဒေတာ
                });
            });
            
            // Global variable ကို update လုပ်သည်
            appointments = tempAppointments;
            
            console.log(`Updated Data: ${appointments.length} records.`);

            // UI များကို Update လုပ်သည်
            if (typeof renderCalendar === "function") renderCalendar();
            if (typeof updateDashboardStats === "function") updateDashboardStats();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// ၄။ App စဖွင့်ချိန်တွင် Data ဆွဲယူရန်
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        fetchPatientsFromSheet();
    }
});
