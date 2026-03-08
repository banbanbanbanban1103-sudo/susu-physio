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

    if (typeof appointments === 'undefined' || appointments.length === 0) {
        if (nextListContainer) nextListContainer.innerHTML = '<p style="text-align: center; color: #64748b; font-size: 0.8rem; padding: 20px;">ဒေတာများ ဆွဲယူနေဆဲ...</p>';
        return;
    }

    // လက်ရှိ မြန်မာစံတော်ချိန် ယူခြင်း
    const now = new Date();
    const mmOffset = 6.5 * 60 * 60 * 1000;
    const mmNow = new Date(now.getTime() + mmOffset);
    const todayStr = mmNow.toISOString().split('T')[0];
    const todayDayOfWeek = mmNow.getUTCDay();

    // (က) ဒီနေ့ လူနာစာရင်း စစ်ထုတ်ခြင်း (Status က 'Complete' ဖြစ်နေရင် မပြပါ)
    const todayAppts = appointments.filter(a => {
        if (a.status === 'Complete') return false;

        const apptDate = new Date(a.time);
        const apptDayOfWeek = apptDate.getDay();

        if (a.date === todayStr) return true;
        
        if (a.type === "Weekly" && apptDayOfWeek === todayDayOfWeek) {
            return new Date(todayStr) >= new Date(a.date);
        }
        return false;
    });

    if (todayCountEl) todayCountEl.innerText = todayAppts.length;

    // (ခ) Next Appointments စာရင်း ပြသခြင်း
    if (nextListContainer) {
        nextListContainer.innerHTML = ''; 

        // ဒီနေ့အတွက် ကျန်ရှိသမျှ လူနာအားလုံးကို အချိန်အလိုက် စီပြမည်
        const upcoming = todayAppts.sort((a, b) => {
            return a.time.localeCompare(b.time);
        });

        if (upcoming.length > 0) {
            upcoming.forEach(appt => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.margin = '10px 0';
                card.style.borderLeft = '4px solid #38bdf8';
                card.style.padding = '15px';
                card.style.background = '#1e293b'; // Card background လေး ပိုပေါ်အောင်
                
                const displayTime = (typeof formatTime === 'function') ? formatTime(appt.time) : (appt.time || '--:--');

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="flex: 1;">
                            <strong style="color: #f8fafc; font-size: 1rem;">${appt.name}</strong>
                            <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 5px;">
                                <i class="fas fa-map-marker-alt"></i> ${appt.address || 'လိပ်စာမရှိပါ'}
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
            nextListContainer.innerHTML = '<p style="text-align: center; color: #64748b; font-size: 0.8rem; padding: 20px;">ယနေ့အတွက် ရက်ချိန်းများ အားလုံး ပြီးဆုံးပါပြီ</p>';
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

    document.addEventListener('touchmove', function(e) {
        if (!e.target.closest('#main-content')) {
            e.preventDefault();
        }
    }, { passive: false });
});
