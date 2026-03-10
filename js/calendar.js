let currentDate = new Date();
let appointments = [];

function getMyanmarToday() {
    var mmNow = new Date(new Date().getTime() + 6.5 * 60 * 60 * 1000);
    return mmNow.toISOString().split('T')[0];
}

function formatTime(timeStr) {
    if (!timeStr) return "အချိန်မရှိ";
    let timePart = "";
    if (timeStr.includes('T')) timePart = timeStr.split('T')[1].substring(0, 5);
    else if (timeStr.includes(' ')) timePart = timeStr.split(' ')[1].substring(0, 5);
    else timePart = timeStr.substring(0, 5);
    let [hours, minutes] = timePart.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2,'0')} ${ampm}`;
}

function renderCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    calendarDays.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    if (monthDisplay) monthDisplay.innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = getMyanmarToday();

    for (let i = 0; i < firstDay; i++) calendarDays.innerHTML += `<div></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
        const dayOfWeek = dateObj.getDay();

        const dayAppts = appointments.filter(a => {
            if (a.status === 'Complete') return false;
            const apptDayOfWeek = new Date(a.date + 'T00:00:00').getDay();
            if (a.date === dateStr) return true;
            if (a.type === "Weekly" && apptDayOfWeek === dayOfWeek)
                return new Date(dateStr) >= new Date(a.date);
            return false;
        });

        const dayEl = document.createElement('div');
        dayEl.innerText = day;
        if (todayStr === dateStr) dayEl.classList.add('current-day');
        if (dayAppts.length > 0) dayEl.classList.add('has-appt');
        dayEl.onclick = () => showAppointments(dateStr, dayOfWeek);
        calendarDays.appendChild(dayEl);
    }
}

function showAppointments(dateStr, dayOfWeek) {
    const dayApptsSection = document.getElementById('dayAppointments');
    const apptListContainer = document.getElementById('appointmentList');
    const selectedDateText = document.getElementById('selectedDateText');
    const todayStr = getMyanmarToday();

    const dayAppts = appointments.filter(a => {
        if (a.status === 'Complete') return false;
        const apptDayOfWeek = new Date(a.date + 'T00:00:00').getDay();
        return a.date === dateStr ||
               (a.type === "Weekly" && apptDayOfWeek === dayOfWeek && new Date(dateStr) >= new Date(a.date));
    });

    if (selectedDateText) selectedDateText.innerText = `📅 ${dateStr} ရှိ ရက်ချိန်းများ (${dayAppts.length} ဦး)`;
    if (apptListContainer) apptListContainer.innerHTML = '';

    if (dayAppts.length > 0) {
        dayAppts.sort((a, b) => a.time.localeCompare(b.time));
        dayAppts.forEach(appt => {
            const item = document.createElement('div');
            item.className = 'appt-item';
            item.style.cssText = 'padding:15px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:10px;background:rgba(255,255,255,0.03);border-radius:12px;';

            const typeTag = appt.type === 'Weekly' ?
                `<span style="font-size:0.65rem;background:#0ea5e9;color:white;padding:2px 6px;border-radius:4px;margin-left:8px;">🔄 Weekly</span>` : '';

            // ★ doneKey: name + apptDate (time မပါ) — data refresh လုပ်ရင်လဲ key ကွာမသွားနိုင်
            const doneKey = `done_${appt.name}_${appt.date}_${todayStr}`;
            const isDoneToday = sessionStorage.getItem(doneKey) === 'true';

            const forceCompleteBtn = appt.type === 'Weekly' ? `
                <button onclick="forceCompletePatient('${appt.name}', '${appt.date}', '${appt.time}')"
                    style="padding:6px 14px;background:#ef4444;border:none;color:white;border-radius:6px;font-weight:bold;cursor:pointer;font-size:0.75rem;margin-left:8px;">
                    <i class="fas fa-trash"></i> အပြီးဖျက်
                </button>` : '';

            const actionArea = isDoneToday ? `
                <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,0.15);border:1px solid #10b981;border-radius:8px;padding:6px 12px;">
                    <i class="fas fa-check-circle" style="color:#10b981;"></i>
                    <span style="color:#10b981;font-size:0.8rem;font-weight:bold;">ယနေ့ ကုသပြီး</span>
                </div>
                ${forceCompleteBtn}
            ` : `
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    <button onclick="markAsComplete('${appt.name}', '${appt.date}', '${appt.time}')"
                        style="padding:6px 14px;background:#10b981;border:none;color:white;border-radius:6px;font-weight:bold;cursor:pointer;font-size:0.75rem;">
                        <i class="fas fa-check"></i> ပြီးပြီ
                    </button>
                    ${forceCompleteBtn}
                </div>
            `;

            item.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                    <div style="flex:1;">
                        <strong style="color:var(--accent-blue);font-size:1.1rem;">${appt.name} ${typeTag}</strong>
                        <p style="font-size:0.85rem;color:var(--text-secondary);margin:5px 0;">
                            <i class="fas fa-phone-alt"></i> ${appt.phone}
                        </p>
                        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:6px;">
                            <i class="fas fa-map-marker-alt"></i> ${appt.address || 'လိပ်စာမရှိပါ'}
                        </p>
                        <p style="font-size:0.75rem;color:#10b981;margin-bottom:10px;">
                            <i class="fas fa-history"></i> ကုသမှု: ${appt.count} ကြိမ်
                        </p>
                        ${actionArea}
                    </div>
                    <div style="text-align:right;">
                        <span style="display:block;color:white;font-weight:bold;background:var(--accent-blue);padding:4px 10px;border-radius:6px;font-size:0.85rem;">
                            ${formatTime(appt.time)}
                        </span>
                        <div style="margin-top:12px;">
                            <button onclick="rebookPatient('${appt.name}','${appt.phone}','${appt.address}')"
                                style="padding:6px 12px;font-size:0.75rem;width:auto;background:transparent;border:1px solid var(--accent-blue);color:var(--accent-blue);border-radius:6px;cursor:pointer;">
                                Re-book
                            </button>
                        </div>
                    </div>
                </div>
            `;
            apptListContainer.appendChild(item);
        });
    } else {
        if (apptListContainer) apptListContainer.innerHTML = '<p style="text-align:center;color:var(--text-secondary);padding:20px;">ရက်ချိန်းမရှိပါ။</p>';
    }

    if (dayApptsSection) {
        dayApptsSection.style.display = 'block';
        dayApptsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

function rebookPatient(name, phone, address) {
    if (typeof showSection === "function") {
        showSection('booking');
        const nameEl = document.getElementById('p-name');
        const phoneEl = document.getElementById('p-phone');
        const addrEl = document.getElementById('p-address');
        if (nameEl) nameEl.value = name;
        if (phoneEl) phoneEl.value = phone;
        if (addrEl) addrEl.value = address;
        if (typeof showToast === "function") showToast(`${name} ၏ အချက်အလက်များကို ဖြည့်ပြီးပါပြီ`);
    }
}

document.addEventListener('DOMContentLoaded', renderCalendar);
