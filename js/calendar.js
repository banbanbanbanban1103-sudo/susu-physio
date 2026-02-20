let currentDate = new Date();
// နမူနာ စမ်းသပ်ရန် Data (နောက်ပိုင်းတွင် Sheets မှ လာမည်)
let appointments = [
    { date: '2026-02-20', name: 'ဦးဘ', time: '10:00 AM', status: 'Regular' },
    { date: '2026-02-22', name: 'ဒေါ်မြ', time: '02:00 PM', status: 'New' },
    { date: '2026-02-20', name: 'မောင်လှ', time: '04:00 PM', status: 'Regular' }
];

function renderCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    const daysGrid = document.getElementById('calendarDays');
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // လအမည်ကို မြန်မာလို ပြချင်ရင် ဒီမှာ Array နဲ့ သတ်မှတ်နိုင်ပါတယ်
    const monthsName = ["ဇန်နဝါရီ", "ဖေဖော်ဝါရီ", "မတ်", "ဧပြီ", "မေ", "ဇွန်", "ဇူလိုင်", "သြဂုတ်", "စက်တင်ဘာ", "အောက်တိုဘာ", "နိုဝင်ဘာ", "ဒီဇင်ဘာ"];
    monthDisplay.innerText = `${monthsName[month]} ${year}`;

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();

    daysGrid.innerHTML = '';

    // ရှေ့လက ပိုနေတဲ့ ရက်လွတ်များ
    for (let i = 0; i < firstDayOfMonth; i++) {
        const emptyDiv = document.createElement('div');
        daysGrid.appendChild(emptyDiv);
    }

    // လအလိုက် ရက်စွဲများ
    for (let i = 1; i <= lastDateOfMonth; i++) {
        const dayDiv = document.createElement('div');
        dayDiv.style.cssText = `
            aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; 
            justify-content: center; font-size: 0.9rem; cursor: pointer; border-radius: 10px; 
            position: relative; transition: 0.2s;
        `;
        dayDiv.innerText = i;

        // ISO format date string (YYYY-MM-DD)
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
        
        // ရက်ချိန်းရှိမရှိ စစ်ဆေးပြီး အစက်လေးထည့်ခြင်း
        const hasAppt = appointments.some(a => a.date === dateStr);
        if (hasAppt) {
            const dot = document.createElement('span');
            dot.style.cssText = `
                width: 5px; height: 5px; background: #38bdf8; border-radius: 50%; 
                position: absolute; bottom: 5px;
            `;
            dayDiv.appendChild(dot);
        }

        // ယနေ့ရက်စွဲကို Highlight လုပ်ခြင်း
        const today = new Date();
        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayDiv.style.border = "2px solid var(--accent-blue)";
            dayDiv.style.fontWeight = "bold";
        }

        dayDiv.onclick = () => showAppointments(dateStr);
        
        // Hover effect လိုချင်ရင် (Simple JS logic)
        dayDiv.onmouseover = () => { dayDiv.style.background = "rgba(255,255,255,0.1)"; };
        dayDiv.onmouseout = () => { dayDiv.style.background = "transparent"; };

        daysGrid.appendChild(dayDiv);
    }
}

function changeMonth(step) {
    currentDate.setMonth(currentDate.getMonth() + step);
    renderCalendar();
}

function showAppointments(dateStr) {
    const listDiv = document.getElementById('appointmentList');
    const detailDiv = document.getElementById('dayAppointments');
    const dateText = document.getElementById('selectedDateText');
    
    const dayData = appointments.filter(a => a.date === dateStr);
    
    dateText.innerText = `${dateStr} ရက်နေ့ ရက်ချိန်းများ`;
    listDiv.innerHTML = '';

    if (dayData.length > 0) {
        dayData.forEach(app => {
            listDiv.innerHTML += `
                <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold;">${app.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${app.time}</div>
                    </div>
                    <span style="font-size: 0.7rem; background: var(--accent-blue); padding: 2px 8px; border-radius: 10px; color: #000;">${app.status}</span>
                </div>
            `;
        });
    } else {
        listDiv.innerHTML = '<p style="font-size:0.8rem; color:var(--text-secondary); text-align:center; padding: 20px;">ရက်ချိန်းမရှိပါ။</p>';
    }
    
    detailDiv.style.display = 'block';
    // Scroll အောက်ကို ဆင်းပေးမယ်
    detailDiv.scrollIntoView({ behavior: 'smooth' });
}

// ပထမဆုံး စဖွင့်ချိန်မှာ Calendar ဆွဲပေးရန်
document.addEventListener('DOMContentLoaded', renderCalendar);
