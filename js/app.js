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
    
    // iOS မှာ screen တစ်ခုလုံး မပါသွားစေရန် main ထဲမှာပဲ scroll တင်ပေးခြင်း
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

    const now = new Date();
    const mmTime = new Date(now.getTime() + (6.5 * 60 * 60 * 1000));
    const todayStr = mmTime.toISOString().split('T')[0];
    
    const todayAppts = appointments.filter(a => a.date === todayStr);
    if (todayCountEl) todayCountEl.innerText = todayAppts.length;

    if (nextListContainer) {
        nextListContainer.innerHTML = ''; 

        const upcoming = appointments.filter(a => {
            const apptFullDate = new Date(`${a.date}T${a.time.includes('T') ? a.time.split('T')[1].substring(0, 5) : '00:00'}`);
            apptFullDate.setMinutes(apptFullDate.getMinutes() + 390);
            return apptFullDate >= now;
        }).sort((a, b) => {
            return new Date(a.time.includes('T') ? a.time : `${a.date}T${a.time}`) - 
                   new Date(b.time.includes('T') ? b.time : `${b.date}T${b.time}`);
        });

        if (upcoming.length > 0) {
            upcoming.slice(0, 5).forEach(appt => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.margin = '10px 0';
                card.style.borderLeft = '4px solid #38bdf8';
                card.style.padding = '15px';
                
                const displayTime = (typeof formatTime === 'function') ? formatTime(appt.time) : (appt.time || '--:--');

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #f8fafc; font-size: 1rem;">${appt.name}</strong>
                            <p style="font-size: 0.8rem; color: #94a3b8; margin-top: 5px;">
                                <i class="fas fa-map-marker-alt"></i> ${appt.address || 'လိပ်စာမရှိပါ'}
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <span style="display: block; color: #38bdf8; font-weight: bold; font-size: 0.9rem;">${displayTime}</span>
                            <span style="font-size: 0.75rem; color: #64748b;">${appt.date === todayStr ? 'Today' : appt.date}</span>
                        </div>
                    </div>
                `;
                nextListContainer.appendChild(card);
            });
        } else {
            nextListContainer.innerHTML = '<p style="text-align: center; color: #64748b; font-size: 0.8rem; padding: 20px;">နောင်လာမည့် ရက်ချိန်း မရှိသေးပါ</p>';
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

// ၆။ iOS Scroll Bounce & Fixed Navigation Fix
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
        // iOS Safari Bounce Fix: အပေါ်ဆုံးနှင့် အောက်ဆုံးတွင် 1px နေရာချန်ထားခြင်း
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

    // iOS မှာ Navigation Bar နေရာကို ဆွဲဆန့် (Stretch) လုပ်ခြင်းမှ ကာကွယ်ရန်
    document.addEventListener('touchmove', function(e) {
        if (!e.target.closest('#main-content')) {
            e.preventDefault();
        }
    }, { passive: false });
});
