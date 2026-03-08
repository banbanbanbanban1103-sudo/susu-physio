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
        const loginOverlay = document.getElementById('login-overlay');
        if (loginOverlay) {
            loginOverlay.style.opacity = '0';
            setTimeout(() => {
                loginOverlay.style.display = 'none';
            }, 500);
        }
        
        showToast('SU Physio မှ ကြိုဆိုပါတယ်', 'success');
        sessionStorage.setItem('isLoggedIn', 'true');
        
        if (typeof fetchPatientsFromSheet === 'function') {
            fetchPatientsFromSheet();
        }
    } else {
        showToast('စကားဝှက် မှားယွင်းနေပါသည်', 'error');
        document.querySelectorAll('#login-overlay input').forEach(i => i.value = '');
        const firstInput = document.getElementById('pass-1');
        if (firstInput) firstInput.focus();
    }
}

// ၃။ Section Switching Logic
function showSection(sectionId) {
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-section');
    });

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block';
        setTimeout(() => activeSection.classList.add('active-section'), 10);
    }

    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const navItem = document.getElementById(`nav-${sectionId}`);
    if (navItem) navItem.classList.add('active');
    
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ၄။ Dashboard Stats & Next Appointments Logic
function updateDashboardStats() {
    const todayCountEl = document.getElementById('today-count');
    const nextListContainer = document.getElementById('next-patient-list');

    // ဒေတာမရှိသေးလျှင် ပြန်ထွက်မည်
    if (typeof appointments === 'undefined' || !Array.isArray(appointments) || appointments.length === 0) {
        if (todayCountEl) todayCountEl.innerText = "0";
        if (nextListContainer) nextListContainer.innerHTML = '<p style="text-align: center; color: #64748b; font-size: 0.8rem; padding: 20px;">ဒေတာများ မရှိသေးပါ</p>';
        return;
    }

    // ✅ ယနေ့ရက်စွဲကို Local Time အတိုင်း တိကျစွာယူခြင်း
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayDayOfWeek = now.getDay();

    // (က) ဒီနေ့ လူနာစာရင်း စစ်ထုတ်ခြင်း
    const todayAppts = appointments.filter(a => {
        // ၁။ Status က 'Complete' ဖြစ်နေရင် လုံးဝမပြပါ
        if (a.status === 'Complete') return false;

        // ၂။ ဒီနေ့အတွက် "ပြီးပြီ" နှိပ်ထားရင် ခဏဖျောက်ထားမည်
        const doneKey = `done_${a.name}_${a.time}_${todayStr}`;
        if (sessionStorage.getItem(doneKey) === 'true') return false;

        // ၃။ ပုံမှန်ရက်ချိန်း သို့မဟုတ် Weekly ရက်ချိန်း စစ်ဆေးခြင်း
        // Sheet မှလာသော time ကို format ညှိ၍ နေ့ရက်စစ်သည်
        let aTimeClean = String(a.time).replace(' ', 'T');
        let aDateObj = new Date(aTimeClean);
        let apptDayOfWeek = aDateObj.getDay();

        if (a.date === todayStr) return true;
        if (a.type === "Weekly" && apptDayOfWeek === todayDayOfWeek) {
            // စတင်တဲ့ရက်ထက် ကျော်မှသာ ပြမည်
            return new Date(todayStr) >= new Date(a.date);
        }
        return false;
    });

    if (todayCountEl) todayCountEl.innerText = todayAppts.length;

    // (ခ) Next Appointments စာရင်း ပြသခြင်း
    if (nextListContainer) {
        nextListContainer.innerHTML = ''; 

        // အချိန်အလိုက် စီမည်
        const upcoming = todayAppts.sort((a, b) => String(a.time).localeCompare(String(b.time)));

        if (upcoming.length > 0) {
            upcoming.forEach(appt => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.cssText = 'margin:10px 0; border-left:4px solid #38bdf8; padding:15px; background:#1e293b; border-radius:12px;';
                
                const displayTime = (typeof formatTime === 'function') ? formatTime(appt.time) : (appt.time || '--:--');

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <strong style="color: #f8fafc; font-size: 1rem;">${appt.name}</strong>
                            <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 5px;">
                                <i class="fas fa-map-marker-alt"></i> ${appt.address || 'လိပ်စာမရှိပါ'}
                            </p>
                            <p style="font-size: 0.75rem; color: #10b981; margin-top: 5px; font-weight: bold;">
                                <i class="fas fa-history"></i> ကုသမှုအကြိမ်ရေ: ${appt.count} ကြိမ်
                            </p>
                            <button onclick="markAsComplete('${appt.name}', '${appt.time}')" 
                                style="width: auto; padding: 6px 14px; font-size: 0.75rem; margin-top: 10px; background: #10b981; border-radius: 8px; border:none; color:white; font-weight:bold; cursor:pointer;">
                                <i class="fas fa-check"></i> ပြီးပြီ
                            </button>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; color: #38bdf8; font-weight: bold; font-size: 0.9rem;">${displayTime}</span>
                            <span style="font-size: 0.75rem; color: #64748b;">${appt.type === 'Weekly' ? '🔄 Weekly' : 'Today'}</span>
                        </div>
                    </div>
                `;
                nextListContainer.appendChild(card);
            });
        } else {
            nextListContainer.innerHTML = '<p style="text-align: center; color: #64748b; font-size: 0.8rem; padding: 20px;">ယနေ့အတွက် ရက်ချိန်းများ မရှိပါ</p>';
        }
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

// ၆။ App Initialize & iOS Fixes
window.addEventListener('load', () => {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        const loginOverlay = document.getElementById('login-overlay');
        if (loginOverlay) loginOverlay.style.display = 'none';
        
        if (typeof fetchPatientsFromSheet === 'function') {
            fetchPatientsFromSheet();
        }
    }

    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.addEventListener('touchstart', function() {
            const top = this.scrollTop;
            const totalScroll = this.scrollHeight;
            const currentScroll = top + this.offsetHeight;

            if (top === 0) {
                this.scrollTop = 1;
            } else if (currentScroll === totalScroll) {
                this.scrollTop = top - 1;
            }
        });
    }
});