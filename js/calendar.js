let currentDate = new Date();
// appointments array သည် sheets.js မှ fetch လုပ်ပြီးမှ ရပါမည်

/**
 * ၁။ အချိန် format ပြောင်းသည့် function
 */
function formatTime(timeStr) {
    if (!timeStr) return "အချိန်မရှိ";
    try {
        // Space ပါနေလျှင် T နှင့် အစားထိုး၍ Standard ISO ဖြစ်အောင်လုပ်သည်
        let cleanTime = String(timeStr).trim().replace(' ', 'T');
        let dateObj = new Date(cleanTime);
        
        // Date object တည်ဆောက်၍မရပါက မူရင်းစာသားကိုသာ ပြသည်
        if (isNaN(dateObj.getTime())) return timeStr.split('T')[1] || timeStr;

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
    
    calendarDays.innerHTML = '';

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (monthDisplay) monthDisplay.innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // လအစ ကွက်လပ်များ
    for (let i = 0; i < firstDay; i++) {
        calendarDays.appendChild(document.createElement('div'));
    }

    // လအတွင်း ရက်များ
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dateObj = new Date(year, month, day);
        const dayOfWeek = dateObj.getDay();

        // လူနာရှိမရှိ စစ်ဆေးခြင်း
        let hasAppt = false;
        if (Array.isArray(appointments)) {
            hasAppt = appointments.some(a => {
                if (a.status === 'Complete') return false;
                
                // Weekly သမားဖြစ်ပါက နေ့တူမတူစစ်သည်
                if (a.type === "Weekly") {
                    let aTime = String(a.time).replace(' ', 'T');
                    let apptDay = new Date(aTime).getDay();
                    return apptDay === dayOfWeek && new Date(dateStr) >= new Date(a.date);
                }
                // ပုံမှန်ရက်ချိန်းဖြစ်ပါက ရက်စွဲတိုက်စစ်သည်
                return a.date === dateStr;
            });
        }

        const dayEl = document.createElement('div');
        dayEl.innerText = day;
        
        // ယနေ့ရက်စွဲ Highlight
        const todayStr = new Date().toISOString().split('T')[0];
        if (dateStr === todayStr) dayEl.classList.add('current-day');
        
        // လူနာရှိလျှင် အစက်ပြရန် class ထည့်သည်
        if (hasAppt) dayEl.classList.add('has-appt');
        
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

    if (!apptListContainer) return;
    apptListContainer.innerHTML = '';

    // Status 'Complete' မဟုတ်သော လူနာများကို စစ်ထုတ်ခြင်း
    const dayAppts = appointments.filter(a => {
        if (a.status === 'Complete') return false;
        
        if (a.type === "Weekly") {
            let aTime = String(a.time).replace(' ', 'T');
            let apptDay = new Date(aTime).getDay();
            return apptDay === dayOfWeek && new Date(dateStr) >= new Date(a.date);
        }
        return a.date === dateStr;
    });

    if (selectedDateText) selectedDateText.innerText = `📅 ${dateStr} ရှိ ရက်ချိန်းများ (${dayAppts.length} ဦး)`;

    if (dayAppts.length > 0) {
        // အချိန်အလိုက် စီခြင်း
        dayAppts.sort((a, b) => String(a.time).localeCompare(String(b.time)));

        dayAppts.forEach(appt => {
            const item = document.createElement('div');
            item.className = 'appt-item';
            item.style.cssText = 'padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px; background: rgba(255,255,255,0.03); border-radius: 12px;';
            
            const typeTag = appt.type === 'Weekly' ? 
                `<span style="font-size: 0.65rem; background: #0ea5e9; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">🔄 Weekly</span>` : '';

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <strong style="color: #38bdf8; font-size: 1.1rem;">${appt.name} ${typeTag}</strong>
                        <p style="font-size: 0.85rem; color: #94a3b8; margin: 5px 0;">
                            <i class="fas fa-phone-alt"></i> ${appt.phone}
                        </p>
                        <p style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 10px;">
                            <i class="fas fa-map-marker-alt"></i> ${appt.address || 'လိပ်စာမရှိပါ'}
                        </p>
                        <button onclick="markAsComplete('${appt.name}', '${appt.time}')" 
                            style="padding: 6px 14px; background: #10b981; border: none; color: white; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.75rem;">
                            <i class="fas fa-check"></i> ပြီးပြီ
                        </button>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; color: white; font-weight: bold; background: #38bdf8; padding: 4px 10px; border-radius: 6px; font-size: 0.85rem;">
                            ${formatTime(appt.time)}
                        </span>
                        <div style="margin-top: 12px;">
                            <button onclick="rebookPatient('${appt.name}', '${appt.phone}', '${appt.address}')" 
                                style="padding: 6px 12px; font-size: 0.75rem; width: auto; background: transparent; border: 1px solid #38bdf8; color: #38bdf8; border-radius: 6px; cursor:pointer;">
                                Re-book
                            </button>
                        </div>
                    </div>
                </div>
            `;
            apptListContainer.appendChild(item);
        });
    } else {
        apptListContainer.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 20px;">ရက်ချိန်းမရှိပါ။</p>';
    }

    if (dayApptsSection) {
        dayApptsSection.style.display = 'block';
        dayApptsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * ၄။ လ ပြောင်းလဲခြင်း
 */
function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

/**
 * ၅။ လူနာဟောင်းအချက်အလက်ဖြင့် အသစ်ပြန်တင်ခြင်း
 */
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

// စဖွင့်ဖွင့်ချင်း Calendar ဆွဲမည်
document.addEventListener('DOMContentLoaded', renderCalendar);