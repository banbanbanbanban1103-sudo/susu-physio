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

    // (က) ဒီနေ့ လူနာစာရင်း စစ်ထုတ်ခြင်း
    const todayAppts = appointments.filter(a => {
        // ၁။ Status က 'Complete' ဖြစ်နေရင် (Once သမားများ) လုံးဝမပြပါ
        if (a.status === 'Complete') return false;

        // ၂။ ဒီနေ့အတွက် "ပြီးပြီ" နှိပ်ထားရင်လည်း (Weekly သမားများ) ခဏဖျောက်ထားမည်
        // ★ doneKey မှာ todayStr ကိုသာ သုံး — Weekly သမားတွေ booking date မတူနိုင်တာကြောင့်
        const doneKey = `done_${a.name}_${todayStr}`;
        if (localStorage.getItem(doneKey) === todayStr) return false;

        // ★ FIX: isoStr "2026-03-08T07:28:00" ကို local time အဖြစ် parse လုပ်ရန်
        // new Date("2026-03-08T07:28:00") browser က UTC ဟု မှတ်ယူတတ်တာမို့
        // date part ကိုသာ သုံးပြီး dayOfWeek ရှာမည်
        const apptDateOnly = new Date(a.date + 'T00:00:00');
        const apptDayOfWeek = apptDateOnly.getDay();

        // ၃။ ပုံမှန်ရက်ချိန်း သို့မဟုတ် Weekly ရက်ချိန်း စစ်ဆေးခြင်း
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

        // အချိန်အလိုက် စီမည်
        const upcoming = todayAppts.sort((a, b) => a.time.localeCompare(b.time));

        if (upcoming.length > 0) {
            upcoming.forEach(appt => {
                const card = document.createElement('div');
                card.className = 'card';
                card.style.margin = '10px 0';
                card.style.borderLeft = '4px solid #38bdf8';
                card.style.padding = '15px';
                card.style.background = '#1e293b';
                
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
                            <button onclick="markAsComplete('${appt.name}', '${appt.date}', '${appt.time}')" 
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

// ★ Complete Celebration — confetti + card flash
function showCompleteAnimation() {
    // ၁။ confetti container
    let cel = document.getElementById('complete-celebration');
    if (!cel) {
        cel = document.createElement('div');
        cel.id = 'complete-celebration';
        document.body.appendChild(cel);
    }
    cel.innerHTML = '';

    const colors = ['#10b981','#38bdf8','#f59e0b','#ec4899','#a78bfa','#34d399','#fbbf24'];
    const shapes = ['border-radius:2px','border-radius:50%','border-radius:0'];

    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        const color    = colors[Math.floor(Math.random() * colors.length)];
        const shape    = shapes[Math.floor(Math.random() * shapes.length)];
        const size     = Math.random() * 8 + 6;
        const left     = Math.random() * 100;
        const duration = Math.random() * 1.5 + 1.2;
        const delay    = Math.random() * 0.8;
        piece.style.cssText = `
            left:${left}vw;
            width:${size}px; height:${size}px;
            background:${color};
            ${shape};
            animation-duration:${duration}s;
            animation-delay:${delay}s;
        `;
        cel.appendChild(piece);
    }

    // ၂။ card flash — visible appt items
    document.querySelectorAll('.appt-item').forEach(el => {
        el.classList.remove('complete-flash');
        void el.offsetWidth;
        el.classList.add('complete-flash');

        // done overlay ✅
        const overlay = document.createElement('div');
        overlay.className = 'done-overlay';
        overlay.style.position = 'relative';
        const icon = document.createElement('div');
        icon.className = 'done-overlay-icon';
        icon.innerText = '✅';
        overlay.appendChild(icon);
        el.style.position = 'relative';
        el.appendChild(overlay);
        setTimeout(() => overlay.remove(), 1500);
    });

    // ၃။ cleanup confetti
    setTimeout(() => { cel.innerHTML = ''; }, 3000);
}


// ★ Custom Confirm Modal (browser confirm() အစားထိုး)
function showConfirm({ icon = "❓", title = "", message = "", okText = "ဟုတ်ကဲ့", okClass = "ok-green", onOk }) {
    let overlay = document.getElementById('confirm-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirm-overlay';
        overlay.className = 'hidden';
        overlay.innerHTML = `
            <div class="confirm-box">
                <div class="confirm-icon" id="confirm-icon"></div>
                <div class="confirm-title" id="confirm-title"></div>
                <div class="confirm-message" id="confirm-message"></div>
                <div class="confirm-buttons">
                    <button class="confirm-btn cancel" id="confirm-cancel">မလုပ်တော့ဘူး</button>
                    <button class="confirm-btn" id="confirm-ok">ဟုတ်ကဲ့</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    }

    document.getElementById('confirm-icon').innerText    = icon;
    document.getElementById('confirm-title').innerText   = title;
    document.getElementById('confirm-message').innerText = message;

    const okBtn = document.getElementById('confirm-ok');
    okBtn.innerText  = okText;
    okBtn.className  = 'confirm-btn ' + okClass;

    overlay.classList.remove('hidden');

    const close = () => overlay.classList.add('hidden');

    okBtn.onclick = () => { close(); if (onOk) onOk(); };
    document.getElementById('confirm-cancel').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
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
