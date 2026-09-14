# Antigravity Multi-Account Quota & Token Reset Tracker ⚡

Aplikasi mandiri (*standalone web & desktop-ready app*) untuk melacak waktu reset kuota/token Google Antigravity (baik limit sprint 5 jam maupun limit mingguan 7 hari) untuk banyak akun secara otomatis, sehingga Anda tidak perlu lagi mencatat tanggal dan jam reset secara manual.

---

## 🚀 Fitur Unggulan

1. **Dashboard Multi-Akun**:
   - Kelola semua akun Antigravity Anda (Nama, Email, Paket: Free / Pro / Ultra).
   - Indikator Status Warna:
     - 🟢 **Tersedia (Ready)**: Kuota aktif dan siap dipakai.
     - 🟡 **Sprint Limit (5 Jam)**: Sedang cooldown 5 jam, dengan countdown waktu nyata.
     - 🔴 **Limit Mingguan (7 Hari)**: Terkunci limit mingguan rolling 168 jam, countdown presisi hingga detik.
2. **Otomatisasi 1-Klik (Tanpa Hitung Manual)**:
   - Tombol `🛑 Limit Mingguan`: Sekali klik, langsung menjadwalkan reset tepat **+7 hari (168 jam)** dari saat ini.
   - Tombol `⚡ Limit 5 Jam`: Sekali klik, langsung menjadwalkan reset tepat **+5 jam** dari saat ini.
   - Tombol `✅ Tandai Sudah Pulih`: Langsung pulihkan akun jika kuota sudah ter-reset lebih awal.
3. **📋 Smart Paste Parser**:
   - Jika Antigravity menampilkan pesan error limit atau Anda mengetik `/quota` atau `/usage`, cukup *copy* teksnya dan klik **Smart Paste**.
   - Contoh teks yang didukung:
     - *"Weekly limit reached. Resets in 4 days 12 hours"*
     - *"Sprint quota exhausted. Resets in 3 hours 20 mins"*
     - *"Weekly quota exhausted. Resets on Friday at 15:30"*
   - Sistem secara otomatis menghitung hari, jam, dan menit reset secara presisi tanpa Anda perlu menghitung kalender!
4. **🎯 Rekomendasi Akun Siap Pakai (Rotator Pintar)**:
   - Banner teratas secara otomatis memberi tahu akun mana yang terbaik dan siap dipakai saat ini, lengkap dengan tombol **Salin Email**.
   - Jika semua akun sedang limit, sistem menampilkan akun tercepat yang akan segera pulih beserta sisa waktu countdown-nya.
5. **🔔 Live Countdown & Notifikasi**:
   - Countdown mundur dinamis detik demi detik.
   - Notifikasi Desktop saat kuota akun pulih dan siap digunakan.
   - Bunyi lonceng (*chime audio synthesizer*) saat reset selesai (dapat diaktifkan/dinonaktifkan).
6. **💾 Backup & Restore JSON**:
   - Data otomatis tersimpan di peramban Anda (`localStorage`).
   - Tersedia tombol Ekspor & Impor JSON jika ingin memindahkan data ke perangkat atau browser lain.

---

## 📂 Cara Membuka Aplikasi

Anda bisa membuka aplikasi dengan salah satu cara berikut:

### Cara 1 (Paling Mudah)
Cukup buka folder:
`C:\Users\Magda Grendy N\.gemini\antigravity\scratch\antigravity-quota-tracker`
dan **klik ganda (double-click)** pada file:
👉 **`buka-aplikasi.bat`**
Aplikasi akan langsung terbuka di browser favorit Anda!

### Cara 2
Buka file [`index.html`](file:///C:/Users/Magda%20Grendy%20N/.gemini/antigravity/scratch/antigravity-quota-tracker/index.html) langsung melalui browser (Google Chrome, Microsoft Edge, Brave, dll).

---

## 💡 Tips Penggunaan Kuota Antigravity

- **Periksa Kuota di Antigravity:** Ketik `/quota` atau `/usage` pada prompt Antigravity IDE atau Antigravity 2.0 untuk melihat rincian sisa token per model.
- **Batasi Pemborosan Token:** Tambahkan file `.antigravityignore` di root project Anda agar agent tidak membaca folder berat seperti `node_modules`, `.git`, atau `dist`.
