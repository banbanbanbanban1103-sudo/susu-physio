let currentDate = new Date();
// appointments array ကို sheets.js ကနေ fetch လုပ်ပြီးမှ ရပါမယ်

/**
 * ၁။ အချိန် format ပြောင်းသည့် function
 */
function formatTime(timeStr) {
    if (!timeStr) return "အချိန်မရှိ";
    try {
        let cleanTime = String(timeStr).replace(' ', 'T');
        let dateObj = new Date(cleanTime);
        
        // Invalid Date ဖြစ်နေရင် မူရင်းစာသားပဲ ပြန်ပေးပါ
        if (isNaN(dateObj.getTime())) return timeStr.split(' ')[1] || timeStr;

        let hours = dateObj.getHours();
        let minutes = dateObj.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = String(minutes).padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
}

/**
 * ၂။ Calendar ကို စတင်ဆွဲသားခြင်း
 */
function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const monthDisplay = document.getElementById('monthDisplay');
    if (!calendarDays) return;
    
    calendarDays.innerHTML = ''; // အဟောင်းတွေကို အရင်ဖျက်မယ်

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (monthDisplay) monthDisplay.innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // လအစ ကွက်လပ်များ
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        calendarDays.appendChild(emptyDiv);
    }

    // လအတွင်း ရက်များ
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEl = document.createElement('div');
        dayEl.innerText = day;
        
        // လူနာရှိမရှိ စစ်ဆေးခြင်း (Safety check ထည့်ထားပါတယ်)
        let hasAppt = false;
        if (Array.isArray(appointments)) {
            hasAppt = appointments.some(a => {
                if (a.status === 'Complete') return false;
                if (a.date === dateStr) return true;
                
                // Weekly စစ်ဆေးခြင်း
                if (a.type === "Weekly") {
                    let aTime = String(a.time).replace(' ', 'T');
                    let apptDay = new Date(aTime).getDay();
                    let currentDayOfWeek = new Date(year, month, day).getDay();
                    return apptDay === currentDayOfWeek && new Date(dateStr) >= new Date(a.date);
                }
                return false;
            });
        }

        if (hasAppt) dayEl.classList.add('has-appt');
        
        // ယနေ့ရက်စွဲ
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr === todayStr) dayEl.classList.add('current-day');

        dayEl.onclick = () => showAppointments(dateStr, new Date(year, month, day).getDay());
        calendarDays.appendChild(dayEl);
    }
}

/**
 * ၃။ ရွေးချယ်လိုက်သော ရက်စွဲရှိ လူနာစာရင်းကို ပြခြင်း
 */
function showAppointments(dateStr, dayOfWeek) {
    const dayApptsSection = document.getElementById('dayAppointments');
    const apptListContainer = document.getElementById('appointmentList');
    const selectedDateText = document.getElementById('selectedDateText');

    if (!apptListContainer) return;
    apptListContainer.innerHTML = '';

    const dayAppts = appointments.filter(a => {
        if (a.status === 'Complete') return false;
        if (a.date === dateStr) return true;
        if (a.type === "Weekly") {
            let aTime = String(a.time).replace(' ', 'T');
            return new Date(aTime).getDay() === dayOfWeek && new Date(dateStr) >= new Date(a.date);
        }
        return false;
    });

    if (selectedDateText) selectedDateText.innerText = `📅 ${dateStr} ရက်ချိန်း (${dayAppts.length} ဦး)`;

    if (dayAppts.length > 0) {
        dayAppts.sort((a, b) => String(a.time).localeCompare(String(b.time)));
        dayAppts.forEach(appt => {
            const item = document.createElement('div');
            item.className = 'appt-item';
            item.style.cssText = 'padding:15px; background:rgba(255,255,255,0.05); border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;';
            item.innerHTML = `
                <div>
                    <strong style="color:#38bdf8;">${appt.name}</strong>
                    <div style="font-size:0.8rem; color:#94a3b8;">${appt.phone}</div>
                    <button onclick="markAsComplete('${appt.name}', '${appt.time}')" style="margin-top:8px; padding:4px 10px; background:#10b981; color:white; border:none; border-radius:5px; font-size:0.7rem;">ပြီးပြီ</button>
                </div>
                <div style="text-align:right;">
                    <div style="color:#38bdf8; font-weight:bold;">${formatTime(appt.time)}</div>
                    <div style="font-size:0.7rem; color:#64748b;">${appt.type}</div>
                </div>
            `;
            apptListContainer.appendChild(item);
        });
    } else {
        apptListContainer.innerHTML = '<p style="text-align:center; color:#64748b; padding:20px;">ရက်ချိန်းမရှိပါ။</p>';
    }

    if (dayApptsSection) dayApptsSection.style.display = 'block';
}

function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

function rebookPatient(name, phone, address) {
    showSection('booking');
    document.getElementById('p-name').value = name;
    document.getElementById('p-phone').value = phone;
    document.getElementById('p-address').value = address;
}

// စဖွင့်လျှင် ဆွဲရန်
document.addEventListener('DOMContentLoaded', renderCalendar);
