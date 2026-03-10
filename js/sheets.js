const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwmYTpsRReEqvw3Gdv2-Xs9yr79UpK-YDmrh4poRMhXKK2Ts_QI9nmlO1QV38mOVD_x/exec";

function getMyanmarToday() {
    var mmNow = new Date(new Date().getTime() + 6.5 * 60 * 60 * 1000);
    return mmNow.toISOString().split('T')[0];
}

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

    var tp = timePart.split(':');
    var hh = String(parseInt(tp[0]) || 0).padStart(2, '0');
    var mm = String(parseInt(tp[1]) || 0).padStart(2, '0');

    return {
        datePart: datePart,
        timePart: hh + ":" + mm,
        isoStr:   datePart + "T" + hh + ":" + mm + ":00"
    };
}

// ★ doneKey helper — name + date ကိုသာ သုံး (time format ပြောင်းလဲနိုင်တာကြောင့်)
function getDoneKey(patientName, dateStr, todayStr) {
    return "done_" + patientName + "_" + dateStr + "_" + todayStr;
}

// ၁။ Booking အသစ် ပို့ခြင်း
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

// ၂။ ပြီးပြီ နှိပ်ခြင်း
async function markAsComplete(patientName, apptDate, dateTime) {
    showConfirm({
        icon: "✅",
        title: "ကုသမှု ပြီးမြောက်ကြောင်း",
        message: patientName + " အတွက် ယနေ့ကုသမှုပြီးမြောက်ကြောင်း မှတ်တမ်းတင်မလား?",
        okText: "မှတ်တမ်းတင်မည်",
        okClass: "ok-green",
        onOk: async () => {
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

        // ★ name + apptDate ကိုသာ သုံး (time မပါ)
        var todayStr = getMyanmarToday();
        var doneKey = getDoneKey(patientName, apptDate, todayStr);
        sessionStorage.setItem(doneKey, 'true');

        if (typeof showToast === "function") showToast('မှတ်တမ်းတင်ပြီးပါပြီ');
        setTimeout(function() { fetchPatientsFromSheet(); }, 1500);

    } catch (error) {
        console.error('Update error:', error);
        if (typeof showToast === "function") showToast('အမှားအယွင်းရှိပါသည်', 'error');
    }
        } // end onOk
    }); // end showConfirm
}

// ၃။ Weekly လူနာ အပြီးအပိုင်ဖျက်ခြင်း
async function forceCompletePatient(patientName, apptDate, dateTime) {
    showConfirm({
        icon: "🗑️",
        title: "ရက်ချိန်းဖျက်မည်",
        message: patientName + " ၏ ရက်ချိန်းကို အပြီးအပိုင် ဖျက်မလား?",
        okText: "ဖျက်မည်",
        okClass: "ok-red",
        onOk: async () => {
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
                setTimeout(function() { fetchPatientsFromSheet(); }, 1500);
            } catch (error) {
                console.error('Force complete error:', error);
            }
        }
    });
}

// ၄။ Sheet မှ Data ဆွဲယူ
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
            console.log("Loaded " + appointments.length + " records.");
            if (typeof renderCalendar === "function") renderCalendar();
            if (typeof updateDashboardStats === "function") updateDashboardStats();
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        setTimeout(function() { fetchPatientsFromSheet(); }, 300);
    }
});
            
