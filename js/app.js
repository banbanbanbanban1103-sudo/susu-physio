// ၁။ Configurations & Security
const CORRECT_PASSCODE = "1234"; 

// ၂။ Login Logic
function checkPasscode() {
    const p1 = document.getElementById('pass-1').value;
    const p2 = document.getElementById('pass-2').value;
    const p3 = document.getElementById('pass-3').value;
    const p4 = document.getElementById('pass-4').value;
    
    const enteredCode = p1 + p2 + p3 + p4;

    if (enteredCode === CORRECT_PASSCODE) {
        document.getElementById('login-overlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('login-overlay').style.display = 'none';
        }, 500);
        
        showToast('SU Physio မှ ကြိုဆိုပါတယ်', 'success');
        sessionStorage.setItem('isLoggedIn', 'true');
        
        // Data များ အလိုအလျောက် Update လုပ်မည်
        if (typeof fetchPatientsFromSheet === 'function') {
            fetchPatientsFromSheet();
        }
    } else {
        showToast('စကားဝှက် မှားယွင်းနေပါသည်', 'error');
        document.querySelectorAll('#login-overlay input').forEach(i => i.value = '');
        document.getElementById('pass-1').focus();
    }
}

// ၃။ Section Switching Logic
function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-section');
    });

    const activeSection = document.getElementById(sectionId);
    activeSection.style.display = 'block';
    setTimeout(() => activeSection.classList.add('active-section'), 10);

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(`nav-${sectionId}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ၄။ Dashboard Stats & Next Appointments Logic
function updateDashboardStats() {
    if (typeof appointments === 'undefined' || appointments.length === 0) return;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // (က) ဒီနေ့ လူနာအရေအတွက် တွက်ခြင်း
    const todayAppts = appointments.filter(a => a.date === todayStr);
    document.getElementById('today-count').innerText = todayAppts.length;

    // (ခ) Next Appointments စာရင်း ပြုလုပ်ခြင်း
    const nextListContainer = document.getElementById('next-patient-list');
    nextListContainer.innerHTML = ''; // အဟောင်းများကို ရှင်းထုတ်မည်

    // လက်ရှိအချိန်ထက် နောက်ကျသော (လာမည့်) ရက်ချိန်းများကို ယူမည်
    const upcoming = appointments.filter(a => {
        const apptTime = new Date(`${a.date}T${a.time || '00:00'}`);
        return apptTime >= now;
    }).sort((a, b) => {
        return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
    });

    if (upcoming.length > 0) {
        // ထိပ်ဆုံးက ၅ ယောက်ကို ပြပေးမည်
        upcoming.slice(0, 5).forEach(appt => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.marginBottom = '10px';
            card.style.borderLeft = '4px solid #38bdf8';
            card.style.padding = '12px';
            
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: #f8fafc; font-size: 0.95rem;">${appt.name}</strong>
                        <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">
                            <i class="fas fa-map-marker-alt"></i> ${appt.address || 'လိပ်စာမရှိပါ'}
                        </p>
                    </div>
                    <div style="text-align: right;">
                        <span style="display: block; color: #38bdf8; font-weight: bold; font-size: 0.85rem;">${appt.time || '--:--'}</span>
                        <span style="font-size: 0.7rem; color: #64748b;">${appt.date === todayStr ? 'Today' : appt.date}</span>
                    </div>
                </div>
            `;
            nextListContainer.appendChild(card);
        });
    } else {
        nextListContainer.innerHTML = '<p style="text-align: center; color: #64748b; font-size: 0.8rem; padding: 20px;">နောက်ထပ် ရက်ချိန်း မရှိသေးပါ</p>';
    }
}

// ၅။ Custom Toast Notification
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ၆။ App Initialize
window.addEventListener('load', () => {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('login-overlay').style.display = 'none';
        if (typeof fetchPatientsFromSheet === 'function') {
            fetchPatientsFromSheet();
        }
    }
});
