// ================================================================
// SkyCast — Frontend JavaScript (CRUD + API inteqrasiyası)
// ================================================================

// Elementlər
const loginBtn       = document.getElementById('loginBtn');
const welcomeText    = document.getElementById('welcomeText');
const noteInput      = document.getElementById('noteInput');
const charCount      = document.getElementById('charCount');
const colorSelect    = document.getElementById('colorSelect');
const addForecastBtn = document.getElementById('addForecastBtn');
const forecastList   = document.getElementById('forecastList');
const subscribeForm  = document.getElementById('subscribeForm');
const passInput      = document.getElementById('passInput');
const errorMsg       = document.getElementById('errorMsg');
const cityTableBody  = document.getElementById('cityTableBody');

// Tarix
document.getElementById('currentDate').textContent =
    new Date().toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' });

// ================================================================
// CRUD — Şəhər əməliyyatları
// ================================================================

// GET — Bütün şəhərləri cədvəldə göstər
const şəhərləriYuklə = async () => {
    try {
        const response = await fetch('/api/v1/data');
        const json     = await response.json();

        cityTableBody.innerHTML = '';

        json.data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.id}</td>
                <td>${item.city}</td>
                <td>${item.temp}</td>
                <td>${item.condition}</td>
                <td>${item.wind}</td>
                <td>${item.humidity}</td>
                <td>
                    <button class="btn-delete" onclick="şəhəriSil(${item.id})">🗑️ Sil</button>
                </td>
            `;
            cityTableBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Şəhərlər yüklənərkən xəta:', err);
    }
};

// POST — Yeni şəhər əlavə et
document.getElementById('addCityBtn').addEventListener('click', async () => {
    const city      = document.getElementById('inputCity').value.trim();
    const temp      = document.getElementById('inputTemp').value.trim();
    const condition = document.getElementById('inputCondition').value.trim();
    const wind      = document.getElementById('inputWind').value.trim();
    const humidity  = document.getElementById('inputHumidity').value.trim();

    if (!city || !temp || !condition || !wind || !humidity) {
        alert('Zəhmət olmasa bütün sahələri doldurun.');
        return;
    }

    await fetch('/api/v1/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, temp, condition, wind, humidity })
    });

    // Sahələri təmizlə
    document.getElementById('inputCity').value      = '';
    document.getElementById('inputTemp').value      = '';
    document.getElementById('inputCondition').value = '';
    document.getElementById('inputWind').value      = '';
    document.getElementById('inputHumidity').value  = '';

    şəhərləriYuklə(); // Cədvəli yenilə
});

// DELETE — Şəhəri sil
// Qeyd: server.js-də DELETE endpoint yoxdur, əlavə edirik
const şəhəriSil = async (id) => {
    if (!confirm(`ID ${id} olan şəhəri silmək istəyirsiniz?`)) return;

    await fetch('/api/v1/data/' + id, { method: 'DELETE' });
    şəhərləriYuklə();
};

// PUT — Şəhər məlumatını yenilə
document.getElementById('updateCityBtn').addEventListener('click', async () => {
    const id        = document.getElementById('updateId').value.trim();
    const temp      = document.getElementById('updateTemp').value.trim();
    const condition = document.getElementById('updateCondition').value.trim();

    if (!id) {
        alert('Zəhmət olmasa şəhərin ID-sini daxil edin.');
        return;
    }

    await fetch('/api/v1/data/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp, condition })
    });

    document.getElementById('updateId').value        = '';
    document.getElementById('updateTemp').value      = '';
    document.getElementById('updateCondition').value = '';

    şəhərləriYuklə();
});

// ================================================================
// Digər funksiyalar
// ================================================================

// Giriş düyməsi
const adGoster = () => {
    const ad = prompt('Adınız nədir?');
    if (ad && ad.trim()) {
        welcomeText.innerText = 'Xoş gəldin, ' + ad.trim() + '!';
    }
};

// Fon rəngi
const fonuDeyis = (e) => {
    document.body.style.background = e.target.value;
};

// Həftəlik proqnoz
let göstərilənIndeks = 0;
let bütünProqnoz     = [];

const yeniGunElaveEt = async () => {
    if (bütünProqnoz.length === 0) {
        const response = await fetch('/api/v1/forecast');
        const json     = await response.json();
        if (json.status === 'success') bütünProqnoz = json.data;
    }
    if (göstərilənIndeks < bütünProqnoz.length) {
        const gun = bütünProqnoz[göstərilənIndeks];
        const li  = document.createElement('li');
        li.textContent = gun.icon + ' ' + gun.day_name + ': ' + gun.temp + ' — ' + gun.description;
        forecastList.appendChild(li);
        göstərilənIndeks++;
    } else {
        alert('Bütün həftəlik proqnoz əlavə olundu!');
    }
};

// Simvol sayacı + avtomatik saxla
let qeydZamanlayici = null;
const avtomatikSaxla = (e) => {
    charCount.textContent = 'Simvol sayı: ' + e.target.value.length;
    clearTimeout(qeydZamanlayici);
    qeydZamanlayici = setTimeout(async () => {
        if (e.target.value.trim().length > 0) {
            await fetch('/api/v1/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: e.target.value.trim() })
            });
        }
    }, 2000);
};

// Abunəlik formu
const formYoxla = async (olay) => {
    olay.preventDefault();
    if (passInput.value.length < 8) {
        errorMsg.style.display = 'block';
    } else {
        errorMsg.style.display = 'none';
        await fetch('/api/v1/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: passInput.value })
        });
        alert('✅ Qeydiyyat tamamlandı!');
        passInput.value = '';
    }
};

// Hadisə dinləyiciləri
loginBtn.addEventListener('click', adGoster);
noteInput.addEventListener('input', avtomatikSaxla);
colorSelect.addEventListener('change', fonuDeyis);
addForecastBtn.addEventListener('click', yeniGunElaveEt);
subscribeForm.addEventListener('submit', formYoxla);

// Səhifə açılanda şəhərləri yüklə
document.addEventListener('DOMContentLoaded', () => {
    şəhərləriYuklə();
});