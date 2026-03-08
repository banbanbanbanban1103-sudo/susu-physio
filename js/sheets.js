// ★ URL အသစ် (Redeployed)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxwPyIKKlv63Fm2ZITPpe2zWtnsgAJIEQmxzQBVeN_BXmaiL_JScp_yWdYvSKe-J5kx/exec";

// ★ Sheet မှ datetime string ကို parse လုပ်သည်
// Sheet က Myanmar local time ဖြင့် သိမ်းထားတာမို့ timezone convert မလို
function parseDateTimeFromSheet(dtStr) {
    dtStr = String(dtStr).trim();
    var datePart = "", timePart = "";

    if (dtStr.includes('T')) {
        datePart = dtStr.split('T')[0];
        timePart = dtStr.split('T')[1].substring(0, 5);
    } else if (dtStr.includes(' ')) {
        var parts = dtStr.split(' ');
        datePart = parts[0];
        timePart = parts[1] ? parts[1].substring(0, 5) : "00:00";
    } else {
        datePart = dtStr.substring(0, 10);
        timePart = "00:00";
    }

    // "7:28" → "07:28"
    var tp = timePart.split(':');
    var hh = String(parseInt(tp[0]) || 0).padStart(2, '0');
    var mm = String(parseInt(tp[1]) || 0).padStart(2, '0');

    return {
        datePart: datePart,
        timePart: hh + ":" + mm,
        isoStr: datePart + "T" + hh + ":" + mm + ":00"
    };
}

// ၁။ Sheet ထဲကို Data အသစ်ပို့ခြင်း
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

// ၂။ ပြီးပြီ နှိပ်ခြင်း — Once ဆိုရင် Sheet မှ row ဖျက်မည်
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

        // Myanmar today
        var now = new Date();
        var mmNow = new Date(now.getTime() + 6.5 * 60 * 60 * 1000);
        var todayStr = mmNow.toISOString().split('T')[0];
        var doneKey = "done_" + patientName + "_" + dateTime + "_" + todayStr;
        sessionStorage.setItem(doneKey, 'true');

        if (typeof showToast === "function") showToast('မှတ်တမ်းတင်ပြီးပါပြီ');
        
        setTimeout(() => { fetchPatientsFromSheet(); }, 1500);

    } catch (error) {
        console.error('Update error:', error);
        if (typeof showToast === "function") showToast('အမှားအယွင်းရှိပါသည်', 'error');
    }
}

// ★ Weekly လူနာကို အပြီးအပိုင် ဖျက်ခြင်း (FORCE_COMPLETE)
async function forceCompletePatient(patientName, dateTime) {
    if (!confirm(patientName + " ၏ ရက်ချိန်းကို အပြီးအပိုင် ဖျက်မလား?")) return;

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: JSON.stringify({
                name: patientName,
                datetime: dateTime,
                action: 'FORCE_COMPLETE'
            })
        });

        if (typeof showToast === "function") showToast(patientName + ' ဖျက်ပြီးပါပြီ');
        setTimeout(() => { fetchPatientsFromSheet(); }, 1500);
    } catch (error) {
        console.error('Force complete error:', error);
    }
}

// ၃။ Sheet မှ Data ဆွဲယူခြင်း
async function fetchPatientsFromSheet() {
    if (!SCRIPT_URL || SCRIPT_URL.includes("YOUR_GOOGLE")) return;

    try {
        var response = await fetch(SCRIPT_URL + "?t=" + Date.now());
        var data = await response.json();
        
        if (Array.isArray(data)) {
            var tempAppointments = [];

            data.forEach(function(item) {
                var parsed = parseDateTimeFromSheet(item.datetime);
                tempAppointments.push({
                    date:    parsed.datePart,
                    name:    item.name    || "Unknown",
                    phone:   item.phone   || "",
                    address: item.address || "",
                    time:    parsed.isoStr,
                    type:    item.type    || "Once",
                    status:  item.status  || "Active",
                    count:   item.count   || 0
                });
            });
            
            appointments = tempAppointments;
            console.log("Loaded " + appointments.length + " records from Sheet.");

            if (typeof renderCalendar === "function") renderCalendar();
            if (typeof updateDashboardStats === "function") updateDashboardStats();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// ၄။ Login ပြီးချိန် Data ဆွဲယူ
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        setTimeout(function() { fetchPatientsFromSheet(); }, 300);
    }
});
