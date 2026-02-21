let currentDate = new Date();
let appointments = []; // Google Sheets မှလာသော Data များ သိမ်းရန်

// --- အချိန်လွဲနေမှု (၆ နာရီခွဲ) ကို ပြင်ဆင်ပေးသည့် Function ---
function formatTime(timeStr) {
    if (!timeStr) return "အချိန်မရှိ";
    
    let timePart = "";
    if (timeStr.includes('T')) {
        timePart = timeStr.split('T')[1].substring(0, 5); // "03:00" စသဖြင့် ယူမည်
    } else {
        timePart = timeStr.substring(0, 5);
    }

    let [hours, minutes] = timePart.split(':').map(Number);

    // မြန်မာစံတော်ချိန် (UTC+6:30) အတွက် မိနစ် ၃၀ နှင့် ၆ နာရီ ပေါင်းထည့်ခြင်း
    let totalMinutes = hours * 60 + minutes + 390; // 390 mins = 6 hours 30 mins
    
    // ၂၄ နာရီထက် ကျော်သွားလျှင် ပြန်ညှိခြင်း
    let finalHours = Math.floor(totalMinutes / 60) % 24;
    let finalMinutes = totalMinutes % 60;

    // 12-hour format (AM/PM) ပြောင်းခြင်း
    const ampm = finalHours >= 12 ? 'PM' : 'AM';
    const displayHours = finalHours % 12 || 12;
    const displayMinutes = String(finalMinutes).padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
}

// ၁။ Calendar ကို စတင်ဆွဲသားခြင်း
function renderCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    
    calendarDays.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthDisplay.innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarDays.innerHTML += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasAppt = appointments.some(a => a.date === dateStr);
        const isToday = new Date().toISOString().split('T')[0] === dateStr;

        const dayEl = document.createElement('div');
        dayEl.innerText = day;
        if (isToday) dayEl.classList.add('current-day');
        if (hasAppt) dayEl.classList.add('has-appt');
        
        dayEl.onclick = () => showAppointments(dateStr);
        
        calendarDays.appendChild(dayEl);
    }
}

// ၂။ ရွေးချယ်လိုက်သော ရက်စွဲရှိ လူနာစာရင်းကို ပြခြင်း (Pop-up Details)
function showAppointments(dateStr) {
    const dayApptsSection = document.getElementById('dayAppointments');
    const apptListContainer = document.getElementById('appointmentList');
    const selectedDateText = document.getElementById('selectedDateText');

    const dayAppts = appointments.filter(a => a.date === dateStr);

    selectedDateText.innerText = `📅 ${dateStr} ရှိ ရက်ချိန်းများ`;
    apptListContainer.innerHTML = '';

    if (dayAppts.length > 0) {
        dayAppts.forEach(appt => {
            const item = document.createElement('div');
            item.style.padding = '12px';
            item.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            item.style.marginBottom = '8px';
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <strong style="color: var(--accent-blue);">${appt.name}</strong>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 4px 0;">
                            <i class="fas fa-phone-alt" style="font-size: 0.7rem;"></i> ${appt.phone || 'ဖုန်းမရှိပါ'}
                        </p>
                        <p style="font-size: 0.8rem; color: var(--text-secondary);">
                            <i class="fas fa-map-marker-alt" style="font-size: 0.7rem;"></i> ${appt.address || 'လိပ်စာမရှိပါ'}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <span style="color: white; font-size: 0.85rem; font-weight: bold;">
                            ${formatTime(appt.time)}
                        </span>
                        <div style="margin-top: 8px;">
                            <button onclick="rebookPatient('${appt.name}', '${appt.phone}', '${appt.address}')" 
                                style="padding: 4px 8px; font-size: 0.7rem; width: auto; background: rgba(56, 189, 248, 0.2); box-shadow: none; border: 1px solid var(--accent-blue);">
                                Re-book
                            </button>
                        </div>
                    </div>
                </div>
            `;
            apptListContainer.appendChild(item);
        });
    } else {
        apptListContainer.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; padding: 10px;">ရက်ချိန်းမရှိပါ။</p>';
    }

    dayApptsSection.style.display = 'block';
    dayApptsSection.scrollIntoView({ behavior: 'smooth' });
}

// ၃။ လ ပြောင်းခြင်း logic
function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

// ၄။ လူနာဟောင်းကို ပြန်လည် Booking တင်ရန် (Auto-fill)
function rebookPatient(name, phone, address) {
    if (typeof showSection === "function") {
        showSection('booking');
        document.getElementById('p-name').value = name;
        document.getElementById('p-phone').value = phone;
        document.getElementById('p-address').value = address;
        if (typeof showToast === "function") showToast(`${name} ၏ အချက်အလက်များကို ဖြည့်ပြီးပါပြီ`);
    }
}

// စဖွင့်ဖွင့်ချင်း Calendar ဆွဲမည်
document.addEventListener('DOMContentLoaded', renderCalendar);
