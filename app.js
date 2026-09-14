/**
 * Antigravity Quota & Token Reset Tracker
 * Mengelola pelacakan reset token mingguan (7 hari) dan 5 jam sprint limit
 * untuk banyak akun secara otomatis tanpa perlu pencatatan manual.
 */

const STORAGE_KEY = 'antigravity_accounts_v2';
const SOUND_KEY = 'antigravity_sound_enabled';

let accounts = [];
let soundEnabled = true;
let currentFilter = 'all';
let searchQuery = '';
let countdownInterval = null;

// --- State Akun Bersih (Tanpa Dummy) ---
let accounts = [];

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

// --- Local Storage Management ---
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      accounts = JSON.parse(raw);
      // Bersihkan data dummy lama jika ada
      accounts = accounts.filter(a => 
        !['acc-1', 'acc-2', 'acc-3'].includes(a.id) &&
        !['dev.utama@gmail.com', 'work.antigravity@company.com', 'cadangan.project@gmail.com'].includes(a.email)
      );
      saveData();
    } else {
      accounts = [];
      saveData();
    }
  } catch (e) {
    console.error('Failed to load accounts:', e);
    accounts = [];
  }

  const rawSound = localStorage.getItem(SOUND_KEY);
  soundEnabled = rawSound !== null ? JSON.parse(rawSound) : true;
  updateSoundButtonUI();
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.error('Failed to save accounts:', e);
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

// --- Actions on Accounts (Fokus Utama Pengguna) ---

// 1. Kena Limit 5 Jam (Sprint Limit Cooldown)
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
  showToast(`🟡 Limit 5 jam diterapkan untuk "${acc.email}". Reset tepat pada ${formatDateTime(reset.toISOString())}`, 'warning');
}

// 2. Kena Limit Mingguan (Weekly 7 Days Hard Cap)
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
  showToast(`🔴 Limit mingguan 7 hari diterapkan untuk "${acc.email}". Reset tepat pada ${formatDateTime(reset.toISOString())}`, 'warning');
}

// 3. Set Akun Siap Pakai Lagi (Restore / Ready)
function setAccountReady(accountId, silent = false) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  acc.status = 'ready';
  acc.lockedAt = null;
  acc.resetAt = null;
  acc.durationMs = 0;
  acc.notified = false;

  saveData();
  renderAll();
  if (!silent) {
    showToast(`🟢 Akun "${acc.email}" kini SIAP DIGUNAKAN!`, 'success');
    playResetChime();
  }
}

// 4. Hapus Akun
function deleteAccount(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  if (confirm(`Yakin ingin menghapus akun "${acc.email}"?`)) {
    accounts = accounts.filter(a => a.id !== accountId);
    saveData();
    renderAll();
    showToast(`Akun "${acc.email}" berhasil dihapus.`, 'info');
  }
}

// 5. Salin Email Cepat
function copyEmail(email) {
  navigator.clipboard.writeText(email).then(() => {
    showToast(`Email ${email} berhasil disalin ke clipboard!`, 'success');
  }).catch(() => {
    showToast(`Gagal menyalin email`, 'error');
  });
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
          <div class="rec-desc">Tambahkan email akun Anda di form bawah untuk mulai memantau waktu reset token secara otomatis.</div>
        </div>
      </div>
    `;
    return;
  }

  const readyAccounts = accounts.filter(a => a.status === 'ready');

  if (readyAccounts.length > 0) {
    const topAcc = readyAccounts[0];
    banner.className = 'recommendation-banner';
    banner.innerHTML = `
      <div class="rec-content">
        <span class="rec-badge">🟢</span>
        <div>
          <div class="rec-title">Rekomendasi Akun Siap Pakai Sekarang: <strong>${escapeHtml(topAcc.email)}</strong></div>
          <div class="rec-desc">Status: <strong>Bisa Digunakan</strong> ${topAcc.name ? '&bull; Label: ' + escapeHtml(topAcc.name) : ''} &bull; Token tersedia!</div>
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
    // Semua akun sedang cooldown / limit!
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
      banner.innerHTML = `
        <div class="rec-content">
          <span class="rec-badge">⏳</span>
          <div>
            <div class="rec-title">Semua Akun Sedang Kena Limit!</div>
            <div class="rec-desc">Akun tercepat yang akan pulih: <strong>${escapeHtml(nextAcc.email)}</strong> dalam <strong>${formatCountdownTextSimple(rem)}</strong> (${formatDateTime(nextAcc.resetAt)})</div>
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

  document.getElementById('metric-total').textContent = total;
  document.getElementById('metric-ready').textContent = readyCount;
  document.getElementById('metric-sprint').textContent = sprintCount;
  document.getElementById('metric-weekly').textContent = weeklyCount;
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
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

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

    // Progress bar fill
    let progressPercent = 100;
    if (!isReady && acc.resetAt && acc.durationMs > 0 && rem && !rem.expired) {
      const elapsed = acc.durationMs - rem.diff;
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / acc.durationMs) * 100)));
    }

    return `
      <div class="account-card ${cardClass}" id="card-${acc.id}">
        <!-- Card Top -->
        <div class="card-top">
          <div class="card-account-info">
            <div class="card-email-row">
              <span class="card-email" title="${escapeHtml(acc.email)}">${escapeHtml(acc.email)}</span>
              <button class="btn-copy-email" onclick="copyEmail('${escapeHtml(acc.email)}')" title="Salin Email">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Salin
              </button>
            </div>
            ${acc.name ? `<span class="card-name">${escapeHtml(acc.name)}</span>` : ''}
          </div>

          <div class="status-badge ${statusClass}">
            <span class="dot"></span>
            <span>${statusLabel}</span>
          </div>
        </div>

        <!-- Middle: Countdown / Ready Info -->
        ${!isReady ? `
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
              <span>Token reset pada: <strong>${formatDateTime(acc.resetAt)}</strong></span>
            </div>
            <div class="cooldown-progress">
              <div class="progress-bar-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>
        ` : `
          <div class="ready-box">
            <div class="ready-box-title">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Token Aktif & Siap Digunakan</span>
            </div>
            <div class="ready-box-desc">
              Akun ini tidak sedang dalam cooldown. Klik salah satu tombol di bawah jika kuota baru saja habis.
            </div>
          </div>
        `}

        <!-- Action Buttons (HANYA DUA TOMBOL HABIS LIMIT) -->
        <div class="card-actions">
          <div class="btn-row-limits">
            <button class="btn-limit-5h" onclick="setSprintLimit('${acc.id}')" title="Mulai hitung mundur 5 jam">
              ⚡ Habis Limit 5 Jam
            </button>
            <button class="btn-limit-weekly" onclick="setWeeklyLimit('${acc.id}')" title="Mulai hitung mundur 7 hari">
              🛑 Habis Limit Mingguan
            </button>
          </div>
        </div>

        <div class="card-bottom">
          <span>ID: ${acc.id.slice(0, 10)}</span>
          <button class="btn-delete-card" onclick="deleteAccount('${acc.id}')" title="Hapus akun ini">
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
              `Akun "${acc.email}" sudah selesai reset dan siap digunakan kembali!`
            );
            showToast(`🎉 "${acc.email}" sudah reset dan siap digunakan!`, 'success');
            playResetChime();
          }
        } else if (rem) {
          const timeElem = document.getElementById(`time-${acc.id}`);
          if (timeElem) {
            timeElem.innerHTML = formatCountdownDisplay(rem);
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

// --- Quick Add Form Handler ---
function setupQuickAddForm() {
  const form = document.getElementById('quick-add-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const emailInput = document.getElementById('input-email');
    const nameInput = document.getElementById('input-name');

    const email = emailInput.value.trim();
    const name = nameInput.value.trim();

    if (!email) {
      showToast('Email akun harus diisi!', 'warning');
      return;
    }

    // Cek apakah email sudah ada
    const exists = accounts.some(a => a.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      showToast(`Akun dengan email ${email} sudah terdaftar!`, 'warning');
      return;
    }

    const newAcc = {
      id: 'acc-' + Date.now(),
      email,
      name: name || '',
      status: 'ready',
      lockedAt: null,
      resetAt: null,
      durationMs: 0,
      notified: false
    };

    accounts.unshift(newAcc); // Letakkan di paling atas
    saveData();
    renderAll();

    emailInput.value = '';
    nameInput.value = '';
    emailInput.focus();

    showToast(`✅ Akun "${email}" berhasil ditambahkan dan siap digunakan!`, 'success');
  });
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
  setupQuickAddForm();
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

// --- Inisialisasi ---
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  renderAll();
  startLiveTicker();
});
