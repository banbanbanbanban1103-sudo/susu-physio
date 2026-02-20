// ၁။ Configurations & Security
const CORRECT_PASSCODE = "1234"; // ဒီမှာ စကားဝှက် ပြောင်းပါ

// ၂။ Login Logic (Passcode စစ်ဆေးခြင်း)
function checkPasscode() {
    const p1 = document.getElementById('pass-1').value;
    const p2 = document.getElementById('pass-2').value;
    const p3 = document.getElementById('pass-3').value;
    const p4 = document.getElementById('pass-4').value;
    
    const enteredCode = p1 + p2 + p3 + p4;

    if (enteredCode === CORRECT_PASSCODE) {
        // စကားဝှက်မှန်လျှင် Login Screen ကို ဖျောက်မည်
        document.getElementById('login-overlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('login-overlay').style.display = 'none';
        }, 500);
        
        showToast('Welcome to SU Physio', 'success');
        
        // Session ထဲမှာ login ဝင်ထားကြောင်း မှတ်သားထားမည် (Refresh လုပ်လျှင် ပြန်မမေးစေရန်)
        sessionStorage.setItem('isLoggedIn', 'true');
        
        // စဖွင့်ဖွင့်ချင်း News Data များ ရှိလျှင် Update လုပ်မည်
        updateDashboardStats();
    } else {
        showToast('စကားဝှက် မှားယွင်းနေပါသည်', 'error');
        // Input များကို ပြန်ဖျက်ပြီး ပထမဆုံး box ကို focus ပြန်ပေးမည်
        document.querySelectorAll('#login-overlay input').forEach(i => i.value = '');
        document.getElementById('pass-1').focus();
    }
}

// ၃။ Section Switching Logic (Tab ပြောင်းခြင်း)
function showSection(sectionId) {
    // Section အားလုံးကို ဖျောက်မည်
    document.querySelectorAll('main section').forEach(section => {
        section.style.display = 'none';
        section.classList.remove('active-section');
    });

    // ရွေးချယ်လိုက်သော Section ကို ပြမည်
    const activeSection = document.getElementById(sectionId);
    activeSection.style.display = 'block';
    setTimeout(() => activeSection.classList.add('active-section'), 10);

    // Bottom Nav Buttons များကို Active ဖြစ်အောင်လုပ်မည်
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById(`nav-${sectionId}`).classList.add('active');

    // Section ပြောင်းတိုင်း အပေါ်ဆုံးသို့ ပြန်သွားမည်
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ၄။ Custom Toast Notification (လှပသော Alert များ)
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

    // ၃ စက္ကန့်ကြာလျှင် ပြန်ဖျောက်မည်
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// ၅။ Dashboard Stats (Today News အတွက် စာရင်းတွက်ချက်မှု)
function updateDashboardStats() {
    // အကယ်၍ appointments data ရှိပါက ဒီနေရာတွင် စာရင်းတွက်မည်
    if (typeof appointments !== 'undefined' && appointments.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const todayAppts = appointments.filter(a => a.date === today);
        
        document.getElementById('today-count').innerText = todayAppts.length;
        
        // ပျမ်းမျှ ကုသခ ၅၀၀၀၀ ဟု ယူဆ၍ တွက်ချက်ခြင်း (မိမိစိတ်ကြိုက် ပြောင်းနိုင်သည်)
        const income = todayAppts.length * 50000;
        document.getElementById('today-income').innerText = income.toLocaleString() + ' KS';
    }
}

// ၆။ App Initialize (စတင်ချိန်တွင် လုပ်ဆောင်ချက်များ)
window.addEventListener('load', () => {
    // ယခင်က Login ဝင်ထားဖူးလျှင် တိုက်ရိုက်ပေးဝင်မည်
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('login-overlay').style.display = 'none';
        updateDashboardStats();
    }
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('SU Physio PWA Active'))
        .catch(err => console.log('PWA Error:', err));
}
