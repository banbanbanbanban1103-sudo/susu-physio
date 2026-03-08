let currentDate = new Date();
// appointments array သည် sheets.js မှ လာပါမည်

/**
 * ၁။ အချိန် format ပြောင်းသည့် function
 */
function formatTime(timeStr) {
    if (!timeStr) return "အချိန်မရှိ";
    
    // Space ပါနေလျှင် T နှင့် အစားထိုး၍ Date Object တည်ဆောက်သည်
    let cleanTime = timeStr.replace(' ', 'T');
    let dateObj = new Date(cleanTime);
    
    // JavaScript ၏ Local Time (မြန်မာစံတော်ချိန်) အတိုင်းသာ ယူပါမည်
    // ၃၉၀ မိနစ် ထပ်ပေါင်းရန် မလိုတော့ပါ (Browser က အော်တို သိပြီးသားမို့လို့ပါ)
    let hours = dateObj.getHours();
    let minutes = dateObj.getMinutes();

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = String(minutes).padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * ၂။ Calendar ကို စတင်ဆွဲသားခြင်း
 */
function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const monthDisplay = document.getElementById('monthDisplay');
    if (!calendarDays) return;
    
    calendarDays.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (monthDisplay) monthDisplay.innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarDays.innerHTML += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay();

        // ပြီးသွားသူများကို ဖယ်ထုတ်၍ ယနေ့ရှိရမည့်သူများကို စစ်သည်
        const dayAppts = appointments.filter(a => {
            if (a.status === 'Complete') return false;

            // Sheet မှလာသော time ကို format ညှိသည်
            let aTime = a.time.replace(' ', 'T');
            let apptDateObj = new Date(aTime);
            let apptDayOfWeek = apptDateObj.getDay();
            
            // ၁။ ရက်စွဲ တိုက်ရိုက်တူရင်ပြ
            if (a.date === dateStr) return true;
            
            // ၂။ Weekly သမားဖြစ်ပြီး နေ့တူရင်ပြ (စတင်တဲ့ရက်ထက် ကျော်မှပြ)
            if (a.type === "Weekly" && apptDayOfWeek === dayOfWeek) {
                return new Date(dateStr) >= new Date(a.date);
            }
            return false;
        });

        const dayEl = document.createElement('div');
        dayEl.innerText = day;
        
        // ယနေ့ရက်စွဲဖြစ်လျှင် Highlight ပြသည်
        const todayStr = new Date().toISOString().split('T')[0];
        if (todayStr === dateStr) dayEl.classList.add('current-day');
        
        // လူနာရှိလျှင် အစက်ပြသည်
        if (dayAppts.length > 0) dayEl.classList.add('has-appt');
        
        dayEl.onclick = () => showAppointments(dateStr, dayOfWeek);
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

    const dayAppts = appointments.filter(a => {
        if (a.status === 'Complete') return false;
        
        let aTime = a.time.replace(' ', 'T');
        let apptDayOfWeek = new Date(aTime).getDay();
        
        return a.date === dateStr || (a.type === "Weekly" && apptDayOfWeek === dayOfWeek && new Date(dateStr) >= new Date(a.date));
    });

    if (selectedDateText) selectedDateText.innerText = `📅 ${dateStr} ရှိ ရက်ချိန်းများ (${dayAppts.length} ဦး)`;
    if (apptListContainer) apptListContainer.innerHTML = '';

    if (dayAppts.length > 0) {
        dayAppts.sort((a, b) => a.time.localeCompare(b.time));

        dayAppts.forEach(appt => {
            const item = document.createElement('div');
            item.className = 'appt-item';
            
            const typeTag = appt.type === 'Weekly' ? 
                `<span style="font-size: 0.65rem; background: #0ea5e9; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">🔄 Weekly</span>` : '';

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); border-radius: 12px; margin-bottom:10px;">
                    <div style="flex: 1;">
                        <strong style="color: #38bdf8; font-size: 1.1rem;">${appt.name} ${typeTag}</strong>
                        <p style="font-size: 0.85rem; color: #94a3b8; margin: 5px 0;"><i class="fas fa-phone-alt"></i> ${appt.phone}</p>
                        <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 10px;"><i class="fas fa-map-marker-alt"></i> ${appt.address || 'လိပ်စာမရှိပါ'}</p>
                        <button onclick="markAsComplete('${appt.name}', '${appt.time}')" style="padding: 6px 14px; background: #10b981; border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.75rem;">ပြီးပြီ</button>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; color: white; font-weight: bold; background: #38bdf8; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem;">${formatTime(appt.time)}</span>
                        <button onclick="rebookPatient('${appt.name}', '${appt.phone}', '${appt.address}')" style="margin-top: 15px; padding: 6px 12px; font-size: 0.75rem; background: transparent; border: 1px solid #38bdf8; color: #38bdf8; border-radius: 6px;">Re-book</button>
                    </div>
                </div>
            `;
            apptListContainer.appendChild(item);
        });
    } else {
        if (apptListContainer) apptListContainer.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 20px;">ရက်ချိန်းမရှိပါ။</p>';
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
        document.getElementById('p-name').value = name;
        document.getElementById('p-phone').value = phone;
        document.getElementById('p-address').value = address;
        if (typeof showToast === "function") showToast(`${name} ၏ အချက်အလက်များကို ဖြည့်ပြီးပါပြီ`);
    }
}

document.addEventListener('DOMContentLoaded', renderCalendar);
