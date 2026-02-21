let currentDate = new Date();
let appointments = []; 

// ၁။ အချိန် format ပြောင်းသည့် function
function formatTime(timeStr) {
    if (!timeStr) return "အချိန်မရှိ";
    let timePart = timeStr.includes('T') ? timeStr.split('T')[1].substring(0, 5) : timeStr.substring(0, 5);
    let [hours, minutes] = timePart.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes + 390; // +6:30 Myanmar Time
    let finalHours = Math.floor(totalMinutes / 60) % 24;
    let finalMinutes = totalMinutes % 60;
    const ampm = finalHours >= 12 ? 'PM' : 'AM';
    const displayHours = finalHours % 12 || 12;
    const displayMinutes = String(finalMinutes).padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
}

// ၂။ Calendar ဆွဲသားခြင်း
function renderCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    const calendarDays = document.getElementById('calendarDays');
    if (!calendarDays) return;
    
    calendarDays.innerHTML = '';
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthDisplay.innerText = `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarDays.innerHTML += `<div></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // အရေးကြီးဆုံးအချက်: date တစ်ခုတည်းနဲ့ တိုက်စစ်မယ်
        const dayAppts = appointments.filter(a => a.date === dateStr);
        const hasAppt = dayAppts.length > 0;
        const isToday = new Date().toISOString().split('T')[0] === dateStr;

        const dayEl = document.createElement('div');
        dayEl.innerText = day;
        if (isToday) dayEl.classList.add('current-day');
        if (hasAppt) dayEl.classList.add('has-appt'); 
        
        dayEl.onclick = () => showAppointments(dateStr);
        calendarDays.appendChild(dayEl);
    }
}

// ၃။ ရက်စွဲနှိပ်လျှင် ရှိသမျှလူနာအားလုံးကို စာရင်းလိုက်ပြရန်
function showAppointments(dateStr) {
    const dayApptsSection = document.getElementById('dayAppointments');
    const apptListContainer = document.getElementById('appointmentList');
    const selectedDateText = document.getElementById('selectedDateText');

    // Filter သုံးထားသဖြင့် လူနာတစ်ယောက်တည်း ၃ ခါရှိလည်း ၃ ခါလုံးပြမည်
    const dayAppts = appointments.filter(a => a.date === dateStr);

    selectedDateText.innerText = `📅 ${dateStr} ရှိ ရက်ချိန်းများ (${dayAppts.length} ဦး)`;
    apptListContainer.innerHTML = '';

    if (dayAppts.length > 0) {
        dayAppts.sort((a, b) => a.time.localeCompare(b.time)); // အချိန်အလိုက် စီပေးခြင်း

        dayAppts.forEach(appt => {
            const item = document.createElement('div');
            item.style.padding = '15px';
            item.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            item.style.marginBottom = '10px';
            item.style.background = 'rgba(255,255,255,0.03)';
            item.style.borderRadius = '8px';
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <strong style="color: var(--accent-blue); font-size: 1.1rem;">${appt.name}</strong>
                        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 5px 0;">
                            <i class="fas fa-phone-alt"></i> ${appt.phone}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; color: white; font-weight: bold; background: var(--accent-blue); padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">
                            ${formatTime(appt.time)}
                        </span>
                        <div style="margin-top: 12px;">
                            <button onclick="rebookPatient('${appt.name}', '${appt.phone}', '${appt.address}')" 
                                style="padding: 6px 12px; font-size: 0.75rem; background: transparent; border: 1px solid var(--accent-blue); color: var(--accent-blue); border-radius: 4px;">
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

function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

function rebookPatient(name, phone, address) {
    showSection('booking');
    document.getElementById('p-name').value = name;
    document.getElementById('p-phone').value = phone;
    document.getElementById('p-address').value = address;
    showToast(`${name} အတွက် ရက်စွဲအသစ် ရွေးပေးပါ`);
}

document.addEventListener('DOMContentLoaded', renderCalendar);
