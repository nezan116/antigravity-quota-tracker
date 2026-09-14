/**
 * Antigravity Quota & Token Reset Tracker
 * Mengelola pelacakan reset token mingguan (7 hari) dan 5 jam sprint limit
 * untuk banyak akun secara otomatis.
 * Mendukung penyimpanan lokal database.json (via server lokal) dan browser localStorage.
 */

const STORAGE_KEY = 'antigravity_accounts_v2';
const SOUND_KEY = 'antigravity_sound_enabled';

let accounts = [];
let soundEnabled = true;
let currentFilter = 'all';
let searchQuery = '';
let countdownInterval = null;

// --- Algoritma Rekomendasi Urutan Label (Akun 1, Akun 2, dst) ---
// Jika akun dihapus, nomor slot yang kosong otomatis direkomendasikan kembali
function getNextAvailableAccountLabel() {
  const usedNumbers = new Set();
  const regex = /^Akun\s*(\d+)$/i;

  accounts.forEach(acc => {
    if (acc.name) {
      const match = acc.name.trim().match(regex);
      if (match) {
        usedNumbers.add(parseInt(match[1], 10));
      }
    }
  });

  let slot = 1;
  while (usedNumbers.has(slot)) {
    slot++;
  }
  return `Akun ${slot}`;
}

function updateLabelSuggestion() {
  const nextLabel = getNextAvailableAccountLabel();
  const nameInput = document.getElementById('input-name');
  if (nameInput) {
    nameInput.placeholder = nextLabel;
    if (!nameInput.value.trim() || /^Akun\s*\d+$/i.test(nameInput.value.trim())) {
      nameInput.value = nextLabel;
    }
  }
}

function sortAccounts() {
  accounts.sort((a, b) => {
    const matchA = (a.name || '').match(/^Akun\s*(\d+)$/i);
    const matchB = (b.name || '').match(/^Akun\s*(\d+)$/i);
    if (matchA && matchB) {
      return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
    }
    if (matchA) return -1;
    if (matchB) return 1;
    return (a.name || a.email).localeCompare(b.name || b.email);
  });
}

// --- Audio Synthesizer (Web Audio API) ---
function playResetChime() {
  if (!soundEnabled) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Nada 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    // Nada 2: A5 (880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.7);
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
}

// --- Browser Notification ---
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendDesktopNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22%20width=%22100%22%20height=%22100%22><text y=%22.9em%22 font-size=%2290%22>⚡</text></svg>'
      });
    } catch (e) {
      console.warn('Notification error:', e);
    }
  }
}

// --- Toast Alert UI ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'error') icon = '❌';

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Storage & Database Management ---
// Mendukung dual-storage: Real database (database.json via server) + browser LocalStorage
async function loadData() {
  // 1. Muat dari LocalStorage untuk respon instan
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      accounts = JSON.parse(raw);
      accounts = accounts.filter(a => 
        !['acc-1', 'acc-2', 'acc-3'].includes(a.id) &&
        !['dev.utama@gmail.com', 'work.antigravity@company.com', 'cadangan.project@gmail.com'].includes(a.email)
      );
    } else {
      accounts = [];
    }
  } catch (e) {
    accounts = [];
  }

  // 2. Jika terhubung dengan backend server (http://localhost:3333), sinkronkan dengan database.json
  if (window.location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const dbData = await res.json();
        if (Array.isArray(dbData) && dbData.length > 0) {
          accounts = dbData;
          saveData(false);
          renderAll();
        }
      }
    } catch (err) {
      // Backend server belum aktif, tetap gunakan localStorage
    }
  }

  const rawSound = localStorage.getItem(SOUND_KEY);
  soundEnabled = rawSound !== null ? JSON.parse(rawSound) : true;
  updateSoundButtonUI();
  updateLabelSuggestion();
}

function saveData(syncBackend = true) {
  // 1. Simpan ke LocalStorage browser
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }

  // 2. Simpan ke database.json di server lokal jika berjalan
  if (syncBackend && window.location.protocol.startsWith('http')) {
    fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accounts)
    }).catch(() => {});
  }
}

// --- Date & Countdown Calculations ---
function formatDateTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const dayName = days[d.getDay()];
  const date = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${dayName}, ${date} ${monthName} ${year} pukul ${hours}:${minutes} WIB`;
}

function getRemainingTime(resetIsoString) {
  if (!resetIsoString) return null;
  const target = new Date(resetIsoString).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) return { expired: true, diff: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { expired: false, diff, days, hours, minutes, seconds };
}

function formatCountdownDisplay(rem) {
  if (!rem || rem.expired) return '00 Jam : 00 Menit : 00 Detik';
  
  const hStr = String(rem.hours).padStart(2, '0');
  const mStr = String(rem.minutes).padStart(2, '0');
  const sStr = String(rem.seconds).padStart(2, '0');

  if (rem.days > 0) {
    return `<span class="day-part">${rem.days} Hari</span> ${hStr} Jam : ${mStr} Menit : ${sStr} Detik`;
  }
  return `${hStr} Jam : ${mStr} Menit : ${sStr} Detik`;
}

function formatCountdownTextSimple(rem) {
  if (!rem || rem.expired) return '00:00:00';
  const dStr = rem.days > 0 ? `${rem.days}h ` : '';
  const hStr = String(rem.hours).padStart(2, '0');
  const mStr = String(rem.minutes).padStart(2, '0');
  const sStr = String(rem.seconds).padStart(2, '0');
  return `${dStr}${hStr}:${mStr}:${sStr}`;
}

// --- FUNGSI SIMPAN AKUN UTAMA ---
function handleSaveAccount(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  const emailInput = document.getElementById('input-email');
  const nameInput = document.getElementById('input-name');

  if (!emailInput) {
    console.error('Elemen input-email tidak ditemukan');
    return;
  }

  const email = emailInput.value.trim();
  let name = nameInput ? nameInput.value.trim() : '';

  if (!email) {
    showToast('Silakan masukkan email akun Google!', 'warning');
    emailInput.focus();
    return;
  }

  // Validasi format email dasar
  if (!email.includes('@')) {
    showToast('Format email tidak valid! Contoh: akun1@gmail.com', 'warning');
    emailInput.focus();
    return;
  }

  // Jika label kosong, gunakan rekomendasi urutan slot otomatis (Akun 1, Akun 2, dll)
  if (!name) {
    name = getNextAvailableAccountLabel();
  }

  // Cek apakah email sudah ada
  const exists = accounts.some(a => a.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    showToast(`Akun dengan email "${email}" sudah ada dalam daftar!`, 'warning');
    return;
  }

  const newAcc = {
    id: 'acc-' + Date.now(),
    email,
    name,
    status: 'ready',
    lockedAt: null,
    resetAt: null,
    durationMs: 0,
    notified: false
  };

  accounts.push(newAcc);
  sortAccounts();
  saveData();
  renderAll();

  // Reset form dan perbarui rekomendasi nomor berikutnya
  emailInput.value = '';
  updateLabelSuggestion();
  emailInput.focus();

  showToast(`✅ Akun "${name}" (${email}) berhasil disimpan!`, 'success');
}

// --- Actions on Accounts ---

// 1. Kena Limit 5 Jam
function setSprintLimit(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const now = new Date();
  const reset = new Date(now.getTime() + 5 * 3600 * 1000); // Tepat 5 Jam ke depan

  acc.status = 'sprint_cooldown';
  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = 5 * 3600 * 1000;
  acc.notified = false;

  saveData();
  renderAll();
  showToast(`🟡 Limit 5 jam diterapkan untuk "${acc.name || acc.email}". Reset pada ${formatDateTime(reset.toISOString())}`, 'warning');
}

// 2. Kena Limit Mingguan
function setWeeklyLimit(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const now = new Date();
  const reset = new Date(now.getTime() + 7 * 24 * 3600 * 1000); // Tepat 7 Hari ke depan

  acc.status = 'weekly_locked';
  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = 7 * 24 * 3600 * 1000;
  acc.notified = false;

  saveData();
  renderAll();
  showToast(`🔴 Limit mingguan 7 hari diterapkan untuk "${acc.name || acc.email}". Reset pada ${formatDateTime(reset.toISOString())}`, 'warning');
}

// 3. Hapus Akun (Nomor urut otomatis kosong dan siap dipakai ulang!)
function deleteAccount(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const displayName = acc.name ? `${acc.name} (${acc.email})` : acc.email;
  if (confirm(`Yakin ingin menghapus akun "${displayName}"?`)) {
    accounts = accounts.filter(a => a.id !== accountId);
    saveData();
    renderAll();
    updateLabelSuggestion();
    showToast(`Akun "${displayName}" berhasil dihapus. Nomor urut siap dipakai kembali!`, 'info');
  }
}

// 4. Salin Email Cepat
function copyEmail(email) {
  navigator.clipboard.writeText(email).then(() => {
    showToast(`Email ${email} berhasil disalin ke clipboard!`, 'success');
  }).catch(() => {
    showToast(`Gagal menyalin email`, 'error');
  });
}

// 5. Atur Jam & Hari Manual (Sesuai sisa waktu di Antigravity)
function applyManualAdjustment(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const daysInput = document.getElementById(`input-days-${accountId}`);
  const hoursInput = document.getElementById(`input-hours-${accountId}`);
  const minsInput = document.getElementById(`input-mins-${accountId}`);

  const days = Math.max(0, parseInt(daysInput ? daysInput.value : 0, 10) || 0);
  const hours = Math.max(0, parseInt(hoursInput ? hoursInput.value : 0, 10) || 0);
  const mins = Math.max(0, parseInt(minsInput ? minsInput.value : 0, 10) || 0);

  const totalMs = ((days * 24 + hours) * 60 + mins) * 60 * 1000;

  if (totalMs <= 0) {
    acc.status = 'ready';
    acc.lockedAt = null;
    acc.resetAt = null;
    acc.durationMs = 0;
    acc.notified = false;
    saveData();
    renderAll();
    showToast(`🟢 Akun "${acc.name || acc.email}" diatur ke Siap Pakai!`, 'success');
    return;
  }

  const now = new Date();
  const reset = new Date(now.getTime() + totalMs);

  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = totalMs;
  acc.notified = false;

  // Jika durasi lebih dari 6 jam atau ada setting hari, jadikan limit mingguan
  if (days >= 1 || totalMs > 6 * 3600 * 1000) {
    acc.status = 'weekly_locked';
  } else {
    acc.status = 'sprint_cooldown';
  }

  saveData();
  renderAll();
  const timeStr = `${days > 0 ? days + ' Hari ' : ''}${hours} Jam ${mins} Menit`;
  showToast(`⚙️ Waktu "${acc.name || acc.email}" disesuaikan ke ${timeStr}. Reset: ${formatDateTime(reset.toISOString())}`, 'success');
}

// Pintasan langsung set jam tertentu (misal: 5 Jam)
function quickSetHours(accountId, targetHours) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const now = new Date();
  const totalMs = targetHours * 3600 * 1000;
  const reset = new Date(now.getTime() + totalMs);

  acc.status = targetHours > 6 ? 'weekly_locked' : 'sprint_cooldown';
  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = totalMs;
  acc.notified = false;

  saveData();
  renderAll();
  showToast(`⚡ Hitung mundur disetel ke ${targetHours} Jam untuk "${acc.name || acc.email}"`, 'warning');
}

// Pintasan langsung set hari tertentu (misal: 7 Hari)
function quickSetDays(accountId, targetDays) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const now = new Date();
  const totalMs = targetDays * 24 * 3600 * 1000;
  const reset = new Date(now.getTime() + totalMs);

  acc.status = 'weekly_locked';
  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = totalMs;
  acc.notified = false;

  saveData();
  renderAll();
  showToast(`🛑 Hitung mundur disetel ke ${targetDays} Hari untuk "${acc.name || acc.email}"`, 'warning');
}

// Tambah / Kurang Jam Cepat (+1 Jam, -1 Jam)
function quickAdjustHours(accountId, deltaHours) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  let currentMs = 0;
  if (acc.resetAt) {
    const diff = new Date(acc.resetAt).getTime() - Date.now();
    if (diff > 0) currentMs = diff;
  }

  const deltaMs = deltaHours * 3600 * 1000;
  const newMs = Math.max(0, currentMs + deltaMs);

  if (newMs <= 0) {
    acc.status = 'ready';
    acc.lockedAt = null;
    acc.resetAt = null;
    acc.durationMs = 0;
    acc.notified = false;
    saveData();
    renderAll();
    showToast(`🟢 Akun "${acc.name || acc.email}" siap digunakan!`, 'success');
    return;
  }

  const now = new Date();
  const reset = new Date(now.getTime() + newMs);

  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = newMs;
  acc.notified = false;

  if (newMs > 6 * 3600 * 1000) {
    acc.status = 'weekly_locked';
  } else {
    acc.status = 'sprint_cooldown';
  }

  saveData();
  renderAll();
  showToast(`⏱️ Waktu disesuaikan ${deltaHours > 0 ? '+' : ''}${deltaHours} Jam untuk "${acc.name || acc.email}"`, 'info');
}

// Tambah / Kurang Hari Cepat (+1 Hari, -1 Hari)
function quickAdjustDays(accountId, deltaDays) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  let currentMs = 0;
  if (acc.resetAt) {
    const diff = new Date(acc.resetAt).getTime() - Date.now();
    if (diff > 0) currentMs = diff;
  }

  const deltaMs = deltaDays * 24 * 3600 * 1000;
  const newMs = Math.max(0, currentMs + deltaMs);

  if (newMs <= 0) {
    acc.status = 'ready';
    acc.lockedAt = null;
    acc.resetAt = null;
    acc.durationMs = 0;
    acc.notified = false;
    saveData();
    renderAll();
    showToast(`🟢 Akun "${acc.name || acc.email}" siap digunakan!`, 'success');
    return;
  }

  const now = new Date();
  const reset = new Date(now.getTime() + newMs);

  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = newMs;
  acc.notified = false;

  if (newMs > 6 * 3600 * 1000) {
    acc.status = 'weekly_locked';
  } else {
    acc.status = 'sprint_cooldown';
  }

  saveData();
  renderAll();
  showToast(`⏱️ Waktu disesuaikan ${deltaDays > 0 ? '+' : ''}${deltaDays} Hari untuk "${acc.name || acc.email}"`, 'info');
}

// Tambah / Kurang Menit Cepat (+15 Mnt, -15 Mnt)
function quickAdjustMins(accountId, deltaMins) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  let currentMs = 0;
  if (acc.resetAt) {
    const diff = new Date(acc.resetAt).getTime() - Date.now();
    if (diff > 0) currentMs = diff;
  }

  const deltaMs = deltaMins * 60 * 1000;
  const newMs = Math.max(0, currentMs + deltaMs);

  if (newMs <= 0) {
    acc.status = 'ready';
    acc.lockedAt = null;
    acc.resetAt = null;
    acc.durationMs = 0;
    acc.notified = false;
    saveData();
    renderAll();
    showToast(`🟢 Akun "${acc.name || acc.email}" siap digunakan!`, 'success');
    return;
  }

  const now = new Date();
  const reset = new Date(now.getTime() + newMs);

  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = newMs;
  acc.notified = false;

  if (newMs > 6 * 3600 * 1000) {
    acc.status = 'weekly_locked';
  } else {
    acc.status = 'sprint_cooldown';
  }

  saveData();
  renderAll();
  showToast(`⏱️ Waktu disesuaikan ${deltaMins > 0 ? '+' : ''}${deltaMins} Menit untuk "${acc.name || acc.email}"`, 'info');
}

// --- Render UI ---

// Banner Rekomendasi Teratas
function renderRecommendation() {
  const banner = document.getElementById('recommendation-banner');
  if (!banner) return;

  if (accounts.length === 0) {
    banner.className = 'recommendation-banner';
    banner.innerHTML = `
      <div class="rec-content">
        <span class="rec-badge">👋</span>
        <div>
          <div class="rec-title">Selamat Datang di Antigravity Token Tracker!</div>
          <div class="rec-desc">Ketik email Anda pada form di bawah lalu klik <strong>Simpan Akun</strong> untuk mulai memantau token.</div>
        </div>
      </div>
    `;
    return;
  }

  const readyAccounts = accounts.filter(a => a.status === 'ready');

  if (readyAccounts.length > 0) {
    const topAcc = readyAccounts[0];
    const accLabel = topAcc.name ? `${escapeHtml(topAcc.name)}: ` : '';
    banner.className = 'recommendation-banner';
    banner.innerHTML = `
      <div class="rec-content">
        <span class="rec-badge">🟢</span>
        <div>
          <div class="rec-title">Rekomendasi Akun Siap Pakai Sekarang: <strong>${accLabel}${escapeHtml(topAcc.email)}</strong></div>
          <div class="rec-desc">Status: <strong>Bisa Digunakan</strong> &bull; Token kuota aktif dan siap dipakai!</div>
        </div>
      </div>
      <div class="rec-action">
        <button class="btn btn-primary" onclick="copyEmail('${escapeHtml(topAcc.email)}')">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Salin Email Ini
        </button>
      </div>
    `;
  } else {
    let nextAcc = null;
    let minTime = Infinity;

    accounts.forEach(a => {
      if (a.resetAt) {
        const diff = new Date(a.resetAt).getTime() - Date.now();
        if (diff > 0 && diff < minTime) {
          minTime = diff;
          nextAcc = a;
        }
      }
    });

    banner.className = 'recommendation-banner all-locked';
    if (nextAcc) {
      const rem = getRemainingTime(nextAcc.resetAt);
      const accDisplay = nextAcc.name ? `${nextAcc.name} (${nextAcc.email})` : nextAcc.email;
      banner.innerHTML = `
        <div class="rec-content">
          <span class="rec-badge">⏳</span>
          <div>
            <div class="rec-title">Semua Akun Sedang Kena Limit!</div>
            <div class="rec-desc">Akun tercepat yang akan pulih: <strong>${escapeHtml(accDisplay)}</strong> dalam <strong>${formatCountdownTextSimple(rem)}</strong> (${formatDateTime(nextAcc.resetAt)})</div>
          </div>
        </div>
      `;
    } else {
      banner.innerHTML = `
        <div class="rec-content">
          <span class="rec-badge">⚠️</span>
          <div>
            <div class="rec-title">Semua Akun Sedang Kena Limit</div>
            <div class="rec-desc">Akun akan pulih otomatis saat waktu hitung mundur selesai.</div>
          </div>
        </div>
      `;
    }
  }
}

// Metrik Angka
function renderMetrics() {
  const total = accounts.length;
  const readyCount = accounts.filter(a => a.status === 'ready').length;
  const sprintCount = accounts.filter(a => a.status === 'sprint_cooldown').length;
  const weeklyCount = accounts.filter(a => a.status === 'weekly_locked').length;

  const mTotal = document.getElementById('metric-total');
  const mReady = document.getElementById('metric-ready');
  const mSprint = document.getElementById('metric-sprint');
  const mWeekly = document.getElementById('metric-weekly');

  if (mTotal) mTotal.textContent = total;
  if (mReady) mReady.textContent = readyCount;
  if (mSprint) mSprint.textContent = sprintCount;
  if (mWeekly) mWeekly.textContent = weeklyCount;
}

// Render Kartu Akun
function renderCards() {
  const grid = document.getElementById('accounts-grid');
  const emptyState = document.getElementById('empty-state');
  if (!grid) return;

  let filtered = accounts.filter(acc => {
    if (currentFilter === 'ready' && acc.status !== 'ready') return false;
    if (currentFilter === 'sprint' && acc.status !== 'sprint_cooldown') return false;
    if (currentFilter === 'weekly' && acc.status !== 'weekly_locked') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmail = acc.email.toLowerCase().includes(q);
      const matchName = (acc.name || '').toLowerCase().includes(q);
      if (!matchEmail && !matchName) return false;
    }
    return true;
  });

  if (accounts.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-dim);">
        Tidak ada akun yang sesuai dengan filter atau kata kunci pencarian.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(acc => {
    const isReady = acc.status === 'ready';
    const isSprint = acc.status === 'sprint_cooldown';
    const isWeekly = acc.status === 'weekly_locked';

    let statusClass = 'ready';
    let statusLabel = '🟢 BISA DIGUNAKAN';
    let cardClass = 'status-ready';

    if (isSprint) {
      statusClass = 'sprint';
      statusLabel = '🟡 COOLDOWN 5 JAM';
      cardClass = 'status-sprint';
    } else if (isWeekly) {
      statusClass = 'weekly';
      statusLabel = '🔴 LIMIT MINGGUAN (7 HARI)';
      cardClass = 'status-weekly';
    }

    const rem = getRemainingTime(acc.resetAt);
    const countdownHtml = formatCountdownDisplay(rem);

    let progressPercent = 100;
    if (!isReady && acc.resetAt && acc.durationMs > 0 && rem && !rem.expired) {
      const elapsed = acc.durationMs - rem.diff;
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / acc.durationMs) * 100)));
    }

    return `
      <div class="account-card ${cardClass}" id="card-${acc.id}">
        <!-- Card Top: Label & Email Jelas -->
        <div class="card-top">
          <div class="card-account-info">
            <div class="card-label-badge-row">
              <span class="card-account-badge">${escapeHtml(acc.name || 'Akun')}</span>
              <button class="btn-copy-email" onclick="copyEmail('${escapeHtml(acc.email)}')" title="Salin Email">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Salin Email
              </button>
            </div>
            <div class="card-email-row" style="margin-top: 4px;">
              <span class="card-email" title="${escapeHtml(acc.email)}">${escapeHtml(acc.email)}</span>
            </div>
          </div>

          <div class="status-badge ${statusClass}">
            <span class="dot"></span>
            <span>${statusLabel}</span>
          </div>
        </div>

        <!-- TEPAT SETELAH NAMA LABEL AKUN: KONTROL WAKTU / LIMIT -->
        ${isReady ? `
          <!-- Kondisi Siap Pakai: Tombol Klik Langsung ke 5 Jam atau 7 Hari -->
          <div class="card-ready-actions">
            <div class="ready-box">
              <div class="ready-box-title">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span>Token Aktif & Siap Digunakan</span>
              </div>
              <div class="ready-box-desc">
                Akun ini siap dipakai di Antigravity. Saat kuota baru saja habis, klik salah satu tombol di bawah untuk langsung menghitung mundur:
              </div>
            </div>

            <div class="btn-row-limits">
              <button class="btn-limit-5h" onclick="setSprintLimit('${acc.id}')" title="Klik langsung: Mulai hitung mundur 5 jam">
                ⚡ Habis Limit 5 Jam
              </button>
              <button class="btn-limit-weekly" onclick="setWeeklyLimit('${acc.id}')" title="Klik langsung: Mulai hitung mundur 7 hari">
                🛑 Habis Limit Mingguan (7 Hari)
              </button>
            </div>
          </div>
        ` : isSprint ? `
          <!-- Kondisi Limit 5 Jam: Countdown + Klik Langsung Sesuaikan Akhir 5 Jam -->
          <div class="countdown-box">
            <div class="countdown-header">
              <span>Sisa Waktu Hitung Mundur:</span>
              <span>${progressPercent}% Menuju Pulih</span>
            </div>
            <div class="countdown-display" id="time-${acc.id}">
              ${countdownHtml}
            </div>
            <div class="reset-date-info">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Akhir reset: <strong>${formatDateTime(acc.resetAt)}</strong></span>
            </div>
            <div class="cooldown-progress">
              <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
            </div>

            <!-- Penyesuaian Akhir 5 Jam saat Di-klik (Langsung sesuaikan agar pas dengan Antigravity) -->
            <div class="click-adjust-section sprint">
              <div class="click-adjust-header">
                <span>⚡ Sesuaikan Akhir 5 Jam (Klik langsung sesuai):</span>
              </div>
              <div class="click-chips-grid">
                <button class="chip-btn" onclick="quickSetHours('${acc.id}', 1)" title="Set tepat 1 Jam lagi">1 Jam</button>
                <button class="chip-btn" onclick="quickSetHours('${acc.id}', 2)" title="Set tepat 2 Jam lagi">2 Jam</button>
                <button class="chip-btn" onclick="quickSetHours('${acc.id}', 3)" title="Set tepat 3 Jam lagi">3 Jam</button>
                <button class="chip-btn" onclick="quickSetHours('${acc.id}', 4)" title="Set tepat 4 Jam lagi">4 Jam</button>
                <button class="chip-btn highlight" onclick="quickSetHours('${acc.id}', 5)" title="Reset ke 5 Jam penuh">⚡ 5 Jam</button>
                <button class="chip-btn step" onclick="quickAdjustHours('${acc.id}', -1)" title="Kurangi 1 Jam">-1 Jam</button>
                <button class="chip-btn step" onclick="quickAdjustHours('${acc.id}', 1)" title="Tambah 1 Jam">+1 Jam</button>
                <button class="chip-btn step" onclick="quickAdjustMins('${acc.id}', -15)" title="Kurangi 15 Menit">-15 Mnt</button>
                <button class="chip-btn step" onclick="quickAdjustMins('${acc.id}', 15)" title="Tambah 15 Menit">+15 Mnt</button>
              </div>
            </div>
          </div>
          <div class="card-switch-limit">
            <button class="btn-switch-limit" onclick="setWeeklyLimit('${acc.id}')" title="Ganti ke Limit Mingguan (7 Hari)">
              🛑 Ganti ke Limit Mingguan (7 Hari) &rarr;
            </button>
          </div>
        ` : `
          <!-- Kondisi Limit Mingguan 7 Hari: Countdown + Klik Langsung Sesuaikan Akhir 7 Hari -->
          <div class="countdown-box">
            <div class="countdown-header">
              <span>Sisa Waktu Hitung Mundur:</span>
              <span>${progressPercent}% Menuju Pulih</span>
            </div>
            <div class="countdown-display" id="time-${acc.id}">
              ${countdownHtml}
            </div>
            <div class="reset-date-info">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Akhir reset: <strong>${formatDateTime(acc.resetAt)}</strong></span>
            </div>
            <div class="cooldown-progress">
              <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
            </div>

            <!-- Penyesuaian Akhir 7 Hari saat Di-klik (Langsung sesuaikan agar pas dengan Antigravity) -->
            <div class="click-adjust-section weekly">
              <div class="click-adjust-header">
                <span>🛑 Sesuaikan Akhir 7 Hari (Klik langsung sesuai):</span>
              </div>
              <div class="click-chips-grid">
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 1)" title="Set tepat 1 Hari lagi">1 Hari</button>
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 2)" title="Set tepat 2 Hari lagi">2 Hari</button>
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 3)" title="Set tepat 3 Hari lagi">3 Hari</button>
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 4)" title="Set tepat 4 Hari lagi">4 Hari</button>
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 5)" title="Set tepat 5 Hari lagi">5 Hari</button>
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 6)" title="Set tepat 6 Hari lagi">6 Hari</button>
                <button class="chip-btn highlight" onclick="quickSetDays('${acc.id}', 7)" title="Reset ke 7 Hari penuh">🛑 7 Hari</button>
                <button class="chip-btn step" onclick="quickAdjustDays('${acc.id}', -1)" title="Kurangi 1 Hari">-1 Hari</button>
                <button class="chip-btn step" onclick="quickAdjustDays('${acc.id}', 1)" title="Tambah 1 Hari">+1 Hari</button>
                <button class="chip-btn step" onclick="quickAdjustHours('${acc.id}', -1)" title="Kurangi 1 Jam">-1 Jam</button>
                <button class="chip-btn step" onclick="quickAdjustHours('${acc.id}', 1)" title="Tambah 1 Jam">+1 Jam</button>
              </div>
            </div>
          </div>
          <div class="card-switch-limit">
            <button class="btn-switch-limit" onclick="setSprintLimit('${acc.id}')" title="Ganti ke Limit 5 Jam">
              ⚡ Ganti ke Limit 5 Jam &rarr;
            </button>
          </div>
        `}

        <!-- Card Bottom -->
        <div class="card-bottom">
          <span style="font-weight: 600; color: #a5b4fc;">${escapeHtml(acc.name || 'Akun')}</span>
          <button class="btn-delete-card" onclick="deleteAccount('${acc.id}')" title="Hapus akun ini agar nomor urut bisa dipakai ulang">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Hapus Akun
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderAll() {
  renderMetrics();
  renderRecommendation();
  renderCards();
}

// --- Live Countdown Loop (Berdetik Setiap Detik) ---
function startLiveTicker() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    let stateChanged = false;

    accounts.forEach(acc => {
      if (acc.status !== 'ready' && acc.resetAt) {
        const rem = getRemainingTime(acc.resetAt);

        // Jika waktu hitung mundur selesai tepat sekarang
        if (rem && rem.expired) {
          acc.status = 'ready';
          acc.lockedAt = null;
          acc.resetAt = null;
          acc.durationMs = 0;
          stateChanged = true;

          if (!acc.notified) {
            acc.notified = true;
            sendDesktopNotification(
              '🎉 Token Antigravity Pulih!',
              `Akun "${acc.name || acc.email}" sudah selesai reset dan siap digunakan kembali!`
            );
            showToast(`🎉 "${acc.name || acc.email}" sudah reset dan siap digunakan!`, 'success');
            playResetChime();
          }
        } else if (rem) {
          const timeElem = document.getElementById(`time-${acc.id}`);
          if (timeElem) {
            timeElem.innerHTML = formatCountdownDisplay(rem);
          }
          const cardElem = document.getElementById(`card-${acc.id}`);
          if (cardElem && acc.durationMs > 0) {
            const elapsed = acc.durationMs - rem.diff;
            const pct = Math.min(100, Math.max(0, Math.round((elapsed / acc.durationMs) * 100)));
            const bar = cardElem.querySelector('.progress-bar-fill');
            if (bar) bar.style.width = pct + '%';
            const headerPct = cardElem.querySelector('.countdown-header span:last-child');
            if (headerPct) headerPct.textContent = `${pct}% Menuju Pulih`;
          }
        }
      }
    });

    if (stateChanged) {
      saveData();
      renderAll();
    }
  }, 1000);
}

// --- Sound Button Toggle ---
function updateSoundButtonUI() {
  const btn = document.getElementById('btn-toggle-sound');
  if (!btn) return;
  if (soundEnabled) {
    btn.classList.add('active');
    btn.title = 'Notifikasi Suara: AKTIF (Klik untuk nonaktifkan)';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
      </svg>
      <span class="btn-text">Suara: ON</span>
    `;
  } else {
    btn.classList.remove('active');
    btn.title = 'Notifikasi Suara: NONAKTIF (Klik untuk aktifkan)';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        <line x1="23" y1="9" x2="17" y2="15"/>
        <line x1="17" y1="9" x2="23" y2="15"/>
      </svg>
      <span class="btn-text">Suara: OFF</span>
    `;
  }
}

// --- Backup & Restore Modal ---
function setupBackupModal() {
  const btnMenu = document.getElementById('btn-backup-menu');
  const modal = document.getElementById('backup-modal');
  const btnClose = document.getElementById('btn-close-backup');
  const btnCloseX = document.getElementById('btn-close-backup-modal');

  btnMenu?.addEventListener('click', () => modal?.classList.remove('hidden'));
  btnClose?.addEventListener('click', () => modal?.classList.add('hidden'));
  btnCloseX?.addEventListener('click', () => modal?.classList.add('hidden'));

  // Ekspor JSON
  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const dataStr = JSON.stringify(accounts, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antigravity-accounts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File backup berhasil diunduh!', 'success');
  });

  // Impor JSON
  document.getElementById('import-file-input')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          if (confirm(`Pulihkan ${imported.length} akun dari file cadangan?`)) {
            accounts = imported;
            saveData();
            renderAll();
            updateLabelSuggestion();
            modal?.classList.add('hidden');
            showToast(`Berhasil memulihkan ${imported.length} akun!`, 'success');
          }
        } else {
          alert('Format file JSON tidak valid!');
        }
      } catch (err) {
        alert('Gagal membaca file: ' + err.message);
      }
    };
    reader.readAsText(file);
  });
}

// --- Setup Event Listeners ---
function setupEventListeners() {
  setupBackupModal();

  // Sound toggle
  document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    localStorage.setItem(SOUND_KEY, JSON.stringify(soundEnabled));
    updateSoundButtonUI();
    if (soundEnabled) {
      playResetChime();
      showToast('Notifikasi suara diaktifkan', 'info');
    } else {
      showToast('Notifikasi suara dinonaktifkan', 'info');
    }
  });

  // Filter pills
  document.querySelectorAll('.filter-pills .pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentFilter = pill.getAttribute('data-filter');
      renderCards();
    });
  });

  // Search box
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderCards();
  });

  // Minta izin notifikasi browser
  window.addEventListener('click', () => {
    requestNotificationPermission();
  }, { once: true });
}

// --- Helper HTML Escape ---
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --- Expose Global Functions to Window ---
window.handleSaveAccount = handleSaveAccount;
window.setSprintLimit = setSprintLimit;
window.setWeeklyLimit = setWeeklyLimit;
window.deleteAccount = deleteAccount;
window.copyEmail = copyEmail;
window.applyManualAdjustment = applyManualAdjustment;
window.quickSetHours = quickSetHours;
window.quickSetDays = quickSetDays;
window.quickAdjustHours = quickAdjustHours;
window.quickAdjustDays = quickAdjustDays;
window.quickAdjustMins = quickAdjustMins;

// --- Inisialisasi ---
function initApp() {
  loadData();
  setupEventListeners();
  renderAll();
  startLiveTicker();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
