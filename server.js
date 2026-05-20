const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - JSON və Statik faylların oxunması üçün
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ================================================================
// 1. Verilənlər Bazası Əlaqəsi və Cədvəlin Yaradılması
// ================================================================
const db = new sqlite3.Database('./library.db', (err) => {
    if (err) {
        console.error('❌ Verilənlər bazasına qoşularkən xəta baş verdi:', err.message);
    } else {
        console.log('[Verilənlər Bazası]: library.db ilə əlaqə quruldu.');
        init_db();
    }
});

function init_db() {
    db.run(`
        CREATE TABLE IF NOT EXISTS cities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT NOT NULL,
            temp TEXT NOT NULL,
            condition TEXT NOT NULL,
            wind TEXT NOT NULL,
            humidity TEXT NOT NULL
        )
    `, (err) => {
        if (err) console.error('❌ Cədvəl yaradılanda xəta:', err.message);
    });
}

// ================================================================
// 2. API ENDPOINTS (CRUD Əməliyyatları)
// ================================================================

// 🟢 READ (GET) — Bütün şəhərləri bazadan gətirir
app.get('/api/v1/data', (req, res) => {
    try {
        db.all('SELECT * FROM cities', [], (err, rows) => {
            if (err) {
                return res.status(500).json({ status: 'error', message: err.message });
            }
            res.json({ data: rows });
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Daxili server xətası' });
    }
});

// 🔵 CREATE (POST) — Yeni şəhər əlavə edir
app.post('/api/v1/data', (req, res) => {
    try {
        const { city, temp, condition, wind, humidity } = req.body;
        if (!city || !temp || !condition || !wind || !humidity) {
            return res.status(400).json({ status: 'error', message: 'Bütün sahələr doldurulmalıdır!' });
        }

        const sql = 'INSERT INTO cities (city, temp, condition, wind, humidity) VALUES (?, ?, ?, ?, ?)';
        db.run(sql, [city, temp, condition, wind, humidity], function(err) {
            if (err) {
                return res.status(500).json({ status: 'error', message: err.message });
            }
            res.status(201).json({ status: 'success', id: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Məlumat saxlanılarkən xəta.' });
    }
});

// 🟡 UPDATE (PUT) — Şəhər məlumatını yeniləyir
app.put('/api/v1/data/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { temp, condition } = req.body;

        if (temp && condition) {
            db.run('UPDATE cities SET temp = ?, condition = ? WHERE id = ?', [temp, condition, id], function(err) {
                if (err) return res.status(500).json({ status: 'error', message: err.message });
                res.json({ status: 'success' });
            });
        } else if (temp) {
            db.run('UPDATE cities SET temp = ? WHERE id = ?', [temp, id], function(err) {
                if (err) return res.status(500).json({ status: 'error', message: err.message });
                res.json({ status: 'success' });
            });
        } else if (condition) {
            db.run('UPDATE cities SET condition = ? WHERE id = ?', [condition, id], function(err) {
                if (err) return res.status(500).json({ status: 'error', message: err.message });
                res.json({ status: 'success' });
            });
        }
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Yenilənmə zamanı xəta.' });
    }
});

// 🔴 DELETE (DELETE) — Şəhəri bazadan silir
app.delete('/api/v1/data/:id', (req, res) => {
    try {
        const { id } = req.params;
        db.run('DELETE FROM cities WHERE id = ?', id, function(err) {
            if (err) {
                return res.status(500).json({ status: 'error', message: err.message });
            }
            res.json({ status: 'success' });
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Silinmə zamanı xəta.' });
    }
});

// ================================================================
// 3. Əlavə Köməkçi Endpointlər (script.js-də çağırılanlar)
// ================================================================

app.get('/api/v1/config', (req, res) => {
    fs.readFile('./config.json', 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Konfiqurasiya oxunmadı' });
        res.json(JSON.parse(data));
    });
});

app.get('/api/v1/forecast', (req, res) => {
    const mockForecast = [
        { day_name: "Bazar ertəsi", temp: "22°C", description: "Günəşli", icon: "☀️" },
        { day_name: "Çərşənbə axşamı", temp: "19°C", description: "Buludlu", icon: "☁️" },
        { day_name: "Çərşənbə", temp: "17°C", description: "Yağışlı", icon: "🌧️" },
        { day_name: "Cümə axşamı", temp: "20°C", description: "Dəyişkən buludlu", icon: "⛅" },
        { day_name: "Cümə", temp: "23°C", description: "Açıq səma", icon: "☀️" }
    ];
    res.json({ status: 'success', data: mockForecast });
});

app.post('/api/v1/notes', (req, res) => {
    console.log('[Avtomatik Saxla]: Qeyd gəldi:', req.body.content);
    res.json({ status: 'success' });
});

app.post('/api/v1/subscribe', (req, res) => {
    res.json({ status: 'success' });
});

app.listen(PORT, () => {
    console.log(`Server ${PORT} portunda işləyir`);
});