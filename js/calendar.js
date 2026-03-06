let currentDate = new Date();
let appointments = []; // Google Sheets မှလာသော Data အားလုံး သိမ်းရန် Array

/**
 * ၁။ အချိန် format ပြောင်းသည့် function
 * Google Sheets မှလာသော UTC အချိန်ကို မြန်မာစံတော်ချိန် (+6:30) သို့ ပြောင်းပေးသည်
 */
function formatTime(timeStr) {
    if (!timeStr) return "အချိန်မရှိ";
    
    let timePart = "";
    if (timeStr.includes('T')) {
        timePart = timeStr.split('T')[1].substring(0, 5);
    } else {
        timePart = timeStr.substring(0, 5);
    }

    let [hours, minutes] = timePart.split(':').map(Number);

    // မြန်မာစံတော်ချိန် (UTC+6:30) အတွက် ၃၉၀ မိနစ် ပေါင်းထည့်ခြင်း
    let totalMinutes = hours * 60 + minutes + 390; 
    
    let finalHours = Math.floor(totalMinutes / 60) % 24;
    let finalMinutes = totalMinutes % 60;

    const ampm = finalHours >= 12 ? 'PM' : 'AM';
    const displayHours = finalHours % 12 || 12;
    const displayMinutes = String(finalMinutes).padStart(2, '0');
    
    return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * ၂။ Calendar ကို စတင်ဆွဲသားခြင်း (Weekly Logic ပါဝင်သည်)
 */
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

    // လအစ မတိုင်မီ ကွက်လပ်များ ဖြည့်ခြင်း
    for (let i = 0; i < firstDay; i++) {
        calendarDays.innerHTML += `<div></div>`;
    }

    // လအတွင်း ရက်များအားလုံးကို ဆွဲထုတ်ခြင်း
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon...

        // Weekly Logic: ရက်စွဲတူတာ သို့မဟုတ် Weekly ဖြစ်ပြီး ပတ်စဉ်နေ့ တူတာကို စစ်မည်
        const dayAppts = appointments.filter(a => {
            const apptDate = new Date(a.time);
            const apptDayOfWeek = apptDate.getDay();
            
            // ၁။ ရက်စွဲ အတိအကျတူရင် ပြမည်
            if (a.date === dateStr) return true;
            
            // ၂။ Weekly ဖြစ်ပြီး ပတ်စဉ်နေ့တူရင် (Booking စတင်တဲ့ရက်ထက် နောက်ပိုင်းဖြစ်မှပြမည်)
            if (a.type === "Weekly" && apptDayOfWeek === dayOfWeek) {
                return new Date(dateStr) >= new Date(a.date);
            }
            return false;
        });

        const hasAppt = dayAppts.length > 0;
        const isToday = new Date().toISOString().split('T')[0] === dateStr;

        const dayEl = document.createElement('div');
        dayEl.innerText = day;
        
        if (isToday) dayEl.classList.add('current-day');
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

    // Normal + Weekly လူနာများကို စုစည်းစစ်ထုတ်ခြင်း
    const dayAppts = appointments.filter(a => {
        const apptDayOfWeek = new Date(a.time).getDay();
        return a.date === dateStr || (a.type === "Weekly" && apptDayOfWeek === dayOfWeek && new Date(dateStr) >= new Date(a.date));
    });

    selectedDateText.innerText = `📅 ${dateStr} ရှိ ရက်ချိန်းများ (${dayAppts.length} ဦး)`;
    apptListContainer.innerHTML = '';

    if (dayAppts.length > 0) {
        // အချိန်အလိုက် စီခြင်း
        dayAppts.sort((a, b) => {
            const timeA = a.time.includes('T') ? a.time.split('T')[1] : a.time;
            const timeB = b.time.includes('T') ? b.time.split('T')[1] : b.time;
            return timeA.localeCompare(timeB);
        });

        dayAppts.forEach(appt => {
            const item = document.createElement('div');
            item.className = 'appt-item';
            item.style.cssText = 'padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 10px; background: rgba(255,255,255,0.03); border-radius: 12px;';
            
            // Weekly လူနာဆိုလျှင် Label လေးပြရန်
            const typeTag = appt.type === 'Weekly' ? 
                `<span style="font-size: 0.65rem; background: #0ea5e9; color: white; padding: 2px 6px; border-radius: 4px; margin-left: 8px;">🔄 Weekly</span>` : '';

            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <strong style="color: var(--accent-blue); font-size: 1.1rem;">${appt.name} ${typeTag}</strong>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 5px 0;">
                            <i class="fas fa-phone-alt"></i> ${appt.phone}
                        </p>
                        <p style="font-size: 0.85rem; color: var(--text-secondary);">
                            <i class="fas fa-map-marker-alt"></i> ${appt.address || 'လိပ်စာမရှိပါ'}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; color: white; font-weight: bold; background: var(--accent-blue); padding: 4px 10px; border-radius: 6px; font-size: 0.85rem;">
                            ${formatTime(appt.time)}
                        </span>
                        <div style="margin-top: 12px;">
                            <button onclick="rebookPatient('${appt.name}', '${appt.phone}', '${appt.address}')" 
                                style="padding: 6px 12px; font-size: 0.75rem; width: auto; background: transparent; border: 1px solid var(--accent-blue); color: var(--accent-blue); border-radius: 6px;">
                                Re-book
                            </button>
                        </div>
                    </div>
                </div>
            `;
            apptListContainer.appendChild(item);
        });
    } else {
        apptListContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">ရက်ချိန်းမရှိပါ။</p>';
    }

    dayApptsSection.style.display = 'block';
    dayApptsSection.scrollIntoView({ behavior: 'smooth' });
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
        document.getElementById('p-name').value = name;
        document.getElementById('p-phone').value = phone;
        document.getElementById('p-address').value = address;
        if (typeof showToast === "function") showToast(`${name} ၏ အချက်အလက်များကို ဖြည့်ပြီးပါပြီ`);
    }
}

// စဖွင့်ဖွင့်ချင်း Calendar ဆွဲမည်
document.addEventListener('DOMContentLoaded', renderCalendar);
