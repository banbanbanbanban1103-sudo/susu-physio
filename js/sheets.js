const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyHS4O-SoQPyfkdMtgUzVa5CGsZx8VBK06-12chBM2kdri00a-u0N86P5fs0ULdKHzw/exec";

// ★ KEY HELPER: Sheet မှ "2026-03-08 7:28" format ကို Myanmar local date string ပြောင်းသည်
// Google Sheets က Myanmar time (UTC+6:30) ဖြင့်သိမ်းထားတာမို့ timezone convert မလိုပါ
// "2026-03-08 7:28" → date part = "2026-03-08", time part = "07:28"
function parseDateTimeFromSheet(dtStr) {
    dtStr = String(dtStr).trim();

    let datePart = "";
    let timePart = "";

    if (dtStr.includes('T')) {
        // ISO format "2026-03-08T07:28:00" — UTC မဆိုပဲ Sheet local time ဖြင့် ထားနိုင်တာမို့
        // Myanmar offset မပေါင်း၊ တိုက်ရိုက် split ယူမည်
        datePart = dtStr.split('T')[0];
        timePart = dtStr.split('T')[1].substring(0, 5);
    } else if (dtStr.includes(' ')) {
        // "2026-03-08 7:28" format
        const parts = dtStr.split(' ');
        datePart = parts[0];
        timePart = parts[1] ? parts[1].substring(0, 5) : "00:00";
    } else {
        datePart = dtStr.substring(0, 10);
        timePart = "00:00";
    }

    // Time ကို HH:MM format ပြောင်းခြင်း (single digit hour fix: "7:28" → "07:28")
    const timeParts = timePart.split(':');
    const hh = String(timeParts[0] || 0).padStart(2, '0');
    const mm = String(timeParts[1] || 0).padStart(2, '0');
    const normalizedTime = `${hh}:${mm}`;

    // Comparable ISO string (local time ဟု မှတ်ယူ၊ timezone offset မပါ)
    const isoStr = `${datePart}T${normalizedTime}:00`;

    return { datePart, timePart: normalizedTime, isoStr };
}

// ၁။ Sheet ထဲကို Data အသစ်လှမ်းပို့ခြင်း
async function saveDataToSheet(patientData) {
    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
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

        // Myanmar today string (local date)
        const now = new Date();
        const mmOffset = 6.5 * 60 * 60 * 1000;
        const mmNow = new Date(now.getTime() + mmOffset);
        const todayStr = mmNow.toISOString().split('T')[0];

        const doneKey = `done_${patientName}_${dateTime}_${todayStr}`;
        sessionStorage.setItem(doneKey, 'true');

        if (typeof showToast === "function") showToast('မှတ်တမ်းတင်ပြီးပါပြီ');
        
        setTimeout(() => { fetchPatientsFromSheet(); }, 1500);

    } catch (error) {
        console.error('Update error:', error);
        if (typeof showToast === "function") showToast('အမှားအယွင်းရှိပါသည်', 'error');
    }
}

// ၃။ Sheet ထဲကနေ Data ပြန်ဖတ်ခြင်း
async function fetchPatientsFromSheet() {
    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_GOOGLE")) return;

    try {
        const response = await fetch(SCRIPT_URL + "?t=" + Date.now());
        const data = await response.json();
        
        if (Array.isArray(data)) {
            let tempAppointments = [];

            data.forEach(item => {
                // ★ Sheet format "2026-03-08 7:28" ကို parse လုပ်ခြင်း
                const parsed = parseDateTimeFromSheet(item.datetime);

                tempAppointments.push({
                    date: parsed.datePart,       // "2026-03-08"
                    name: item.name || "Unknown",
                    phone: item.phone || "",
                    address: item.address || "",
                    time: parsed.isoStr,          // "2026-03-08T07:28:00" — compare လုပ်ရလွယ်အောင်
                    type: item.type || "Once",
                    status: item.status || "Active",
                    count: item.count || 0
                });
            });
            
            appointments = tempAppointments;
            console.log(`Loaded ${appointments.length} records from Sheet.`);

            if (typeof renderCalendar === "function") renderCalendar();
            if (typeof updateDashboardStats === "function") updateDashboardStats();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// ၄။ App စဖွင့်ချိန် / login ပြီးချိန် Data ဆွဲယူရန်
document.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        setTimeout(() => { fetchPatientsFromSheet(); }, 300);
    }
});
