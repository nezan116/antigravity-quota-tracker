/**
 * Antigravity Quota & Token Reset Tracker
 * Mengelola pelacakan reset token mingguan (7 hari) dan 5 jam sprint limit
 * untuk banyak akun secara otomatis.
 * Mendukung penyimpanan lokal database.json (via server lokal) dan browser localStorage.
 */

const STORAGE_KEY = 'antigravity_accounts_v2';
const SOUND_KEY = 'antigravity_sound_enabled';
const HISTORY_KEY = 'antigravity_history_v1';

let accounts = [];
let actionHistory = [];
let soundEnabled = true;
let currentFilter = 'recommended';
let searchQuery = '';
let countdownInterval = null;
// Daftar profil Chrome yang terdeteksi otomatis (Bekerja 100% online di GitHub Pages)
const EMBEDDED_CHROME_PROFILES = [
  {
    "dir": "Default",
    "email": "grendy70@gmail.com",
    "name": "A | Nezan"
  },
  {
    "dir": "Profile 1",
    "email": "mzhter75@gmail.com",
    "name": "NZ001"
  },
  {
    "dir": "Profile 10",
    "email": "varkamidas@gmail.com",
    "name": "NZ011"
  },
  {
    "dir": "Profile 100",
    "email": "zarraheejab@gmail.com",
    "name": "NEZ173"
  },
  {
    "dir": "Profile 101",
    "email": "canayacollection6@gmail.com",
    "name": "NEZ174"
  },
  {
    "dir": "Profile 102",
    "email": "hannafashionable@gmail.com",
    "name": "NEZ175"
  },
  {
    "dir": "Profile 103",
    "email": "rezkyagrande@gmail.com",
    "name": "NEZ176"
  },
  {
    "dir": "Profile 104",
    "email": "butikanisa0@gmail.com",
    "name": "NEZ177"
  },
  {
    "dir": "Profile 105",
    "email": "chanayafitzone@gmail.com",
    "name": "NEZ178"
  },
  {
    "dir": "Profile 106",
    "email": "hannasportstation@gmail.com",
    "name": "NEZ179"
  },
  {
    "dir": "Profile 109",
    "email": "shantikaazara@gmail.com",
    "name": "NEZ157"
  },
  {
    "dir": "Profile 11",
    "email": "skrikangel@gmail.com",
    "name": "NEZ110"
  },
  {
    "dir": "Profile 110",
    "email": "hilyastore171@gmail.com",
    "name": "NEZ161"
  },
  {
    "dir": "Profile 111",
    "email": "khansaomara@gmail.com",
    "name": "NEZ162"
  },
  {
    "dir": "Profile 112",
    "email": "stylestrom.fashion@gmail.com",
    "name": "NEZ181"
  },
  {
    "dir": "Profile 114",
    "email": "esjuqae342@mihba.site",
    "name": "a data suhu"
  },
  {
    "dir": "Profile 12",
    "email": "ronaldinhooutfit@gmail.com",
    "name": "NEZ111"
  },
  {
    "dir": "Profile 13",
    "email": "marchstore314@gmail.com",
    "name": "NEZ112"
  },
  {
    "dir": "Profile 14",
    "email": "mprovideoofficial@gmail.com",
    "name": "A MPRO EMAIL"
  },
  {
    "dir": "Profile 15",
    "email": "sidosugeh2026@gmail.com",
    "name": "A Email Test"
  },
  {
    "dir": "Profile 16",
    "email": "valxqei862@daamul.site",
    "name": "NEZ100"
  },
  {
    "dir": "Profile 17",
    "email": "orueprn039@daamul.site",
    "name": "NEZ101"
  },
  {
    "dir": "Profile 18",
    "email": "cueyebz248@daamul.site",
    "name": "NEZ102"
  },
  {
    "dir": "Profile 19",
    "email": "iaqngap566@daamul.site",
    "name": "NEZ103"
  },
  {
    "dir": "Profile 2",
    "email": "wearleonel@gmail.com",
    "name": "NZ002"
  },
  {
    "dir": "Profile 20",
    "email": "uhaquop337@daamul.site",
    "name": "NEZ104"
  },
  {
    "dir": "Profile 21",
    "email": "diontud031@daamul.site",
    "name": "NEZ105"
  },
  {
    "dir": "Profile 23",
    "email": "lqufvux084@daamul.site",
    "name": "NEZ106"
  },
  {
    "dir": "Profile 24",
    "email": "aqjhufr814@daamul.site",
    "name": "NEZ107"
  },
  {
    "dir": "Profile 25",
    "email": "jamoege797@daamul.site",
    "name": "NEZ108"
  },
  {
    "dir": "Profile 26",
    "email": "ltzoafa631@daamul.site",
    "name": "NEZ109"
  },
  {
    "dir": "Profile 28",
    "email": "dunhiilfilter889@gmail.com",
    "name": "NEZ114"
  },
  {
    "dir": "Profile 29",
    "email": "thinkpads2134@gmail.com",
    "name": "NEZ115"
  },
  {
    "dir": "Profile 3",
    "email": "messiwear7@gmail.com",
    "name": "NZ003"
  },
  {
    "dir": "Profile 30",
    "email": "cookiebagustumbal@gmail.com",
    "name": "NEZ116"
  },
  {
    "dir": "Profile 31",
    "email": "cookiebagus5@gmail.com",
    "name": "NEZ117"
  },
  {
    "dir": "Profile 34",
    "email": "nezan116@gmail.com",
    "name": "A NEZAN"
  },
  {
    "dir": "Profile 36",
    "email": "cookietumbal379@gmail.com",
    "name": "NEZ119"
  },
  {
    "dir": "Profile 37",
    "email": "shopelemahpol50@gmail.com",
    "name": "NEZ120"
  },
  {
    "dir": "Profile 38",
    "email": "shopelemahpol23@gmail.com",
    "name": "NEZ121"
  },
  {
    "dir": "Profile 39",
    "email": "kangcookie00@gmail.com",
    "name": "NEZ122"
  },
  {
    "dir": "Profile 40",
    "email": "shopelemah980@gmail.com",
    "name": "NEZ123"
  },
  {
    "dir": "Profile 41",
    "email": "shopelemah7@gmail.com",
    "name": "NEZ124"
  },
  {
    "dir": "Profile 42",
    "email": "shopelemah@gmail.com",
    "name": "NEZ125"
  },
  {
    "dir": "Profile 43",
    "email": "shopelemah72@gmail.com",
    "name": "NEZ126"
  },
  {
    "dir": "Profile 44",
    "email": "shopelemah8@gmail.com",
    "name": "NEZ127"
  },
  {
    "dir": "Profile 46",
    "email": "shopelemah30@gmail.com",
    "name": "NEZ118"
  },
  {
    "dir": "Profile 47",
    "email": "shopelemah87@gmail.com",
    "name": "NEZ128"
  },
  {
    "dir": "Profile 48",
    "email": "shopelemah353@gmail.com",
    "name": "NEZ129"
  },
  {
    "dir": "Profile 49",
    "email": "shopebaik20@gmail.com",
    "name": "NEZ130"
  },
  {
    "dir": "Profile 5",
    "email": "nalensan12@gmail.com",
    "name": "NEZ113"
  },
  {
    "dir": "Profile 50",
    "email": "shopekuat240@gmail.com",
    "name": "NEZ131"
  },
  {
    "dir": "Profile 51",
    "email": "shopekuat28@gmail.com",
    "name": "NEZ132"
  },
  {
    "dir": "Profile 52",
    "email": "shopekuat4@gmail.com",
    "name": "NEZ133"
  },
  {
    "dir": "Profile 53",
    "email": "shopekuat82@gmail.com",
    "name": "NEZ134"
  },
  {
    "dir": "Profile 54",
    "email": "shopebaik76@gmail.com",
    "name": "NEZ135"
  },
  {
    "dir": "Profile 55",
    "email": "shopebaik86@gmail.com",
    "name": "NEZ136"
  },
  {
    "dir": "Profile 56",
    "email": "zhakirnaik300@gmail.com",
    "name": "NEZ137"
  },
  {
    "dir": "Profile 57",
    "email": "namedoor02@gmail.com",
    "name": "NEZ138"
  },
  {
    "dir": "Profile 58",
    "email": "laiylaproject@gmail.com",
    "name": "NEZ139"
  },
  {
    "dir": "Profile 59",
    "email": "tumbalcokie2@gmail.com",
    "name": "NEZ140"
  },
  {
    "dir": "Profile 6",
    "email": "amnezan96@gmail.com",
    "name": "NZ006"
  },
  {
    "dir": "Profile 60",
    "email": "cookietumbal10@gmail.com",
    "name": "NEZ141"
  },
  {
    "dir": "Profile 61",
    "email": "cokiejembhot@gmail.com",
    "name": "NEZ142"
  },
  {
    "dir": "Profile 62",
    "email": "shopelemah2@gmail.com",
    "name": "NEZ143"
  },
  {
    "dir": "Profile 67",
    "email": "recalrestok@gmail.com",
    "name": "NEZ144"
  },
  {
    "dir": "Profile 68",
    "email": "nexaoutfit210@gmail.com",
    "name": "NEZ145"
  },
  {
    "dir": "Profile 69",
    "email": "ministyle60@gmail.com",
    "name": "NEZ146"
  },
  {
    "dir": "Profile 7",
    "email": "nezan116@gmail.com",
    "name": "NZ007"
  },
  {
    "dir": "Profile 70",
    "email": "glamourique.style@gmail.com",
    "name": "NEZ147"
  },
  {
    "dir": "Profile 71",
    "email": "vallenclothstore@gmail.com",
    "name": "NEZ148"
  },
  {
    "dir": "Profile 72",
    "email": "zahrahafizha83@gmail.com",
    "name": "NEZ150"
  },
  {
    "dir": "Profile 73",
    "email": "aurellinacaressa@gmail.com",
    "name": "NEZ149"
  },
  {
    "dir": "Profile 74",
    "email": "aisyahaqila9999@gmail.com",
    "name": "NEZ150"
  },
  {
    "dir": "Profile 75",
    "email": "anindyasaputri77@gmail.com",
    "name": "NEZ151"
  },
  {
    "dir": "Profile 77",
    "email": "anayavanya069@gmail.com",
    "name": "NEZ152"
  },
  {
    "dir": "Profile 78",
    "email": "zivannaelisse@gmail.com",
    "name": "NEZ153"
  },
  {
    "dir": "Profile 79",
    "email": "aisyaazzahra231@gmail.com",
    "name": "NEZ154"
  },
  {
    "dir": "Profile 8",
    "email": "zhakirnaik300@gmail.com",
    "name": "NZ008"
  },
  {
    "dir": "Profile 80",
    "email": "staylishalpha@gmail.com",
    "name": "NEZ155"
  },
  {
    "dir": "Profile 85",
    "email": "trendladybags@gmail.com",
    "name": "NEZ158"
  },
  {
    "dir": "Profile 86",
    "email": "aftalive4@gmail.com",
    "name": "NEZ159"
  },
  {
    "dir": "Profile 87",
    "email": "aftalive7@gmail.com",
    "name": "NEZ160"
  },
  {
    "dir": "Profile 88",
    "email": "agniarahma777@gmail.com",
    "name": "NEZ156"
  },
  {
    "dir": "Profile 9",
    "email": "hutaostore088@gmail.com",
    "name": "NZ010"
  },
  {
    "dir": "Profile 90",
    "email": "aftalive@gmail.com",
    "name": "NEZ163"
  },
  {
    "dir": "Profile 91",
    "email": "najmaputri443@gmail.com",
    "name": "NEZ164"
  },
  {
    "dir": "Profile 92",
    "email": "aizacyra@gmail.com",
    "name": "NEZ165"
  },
  {
    "dir": "Profile 93",
    "email": "ootdfrenky@gmail.com",
    "name": "NEZ166"
  },
  {
    "dir": "Profile 94",
    "email": "berkahshop231@gmail.com",
    "name": "NEZ167"
  },
  {
    "dir": "Profile 95",
    "email": "lylyanimey@gmail.com",
    "name": "NEZ168"
  },
  {
    "dir": "Profile 96",
    "email": "roberttaunan10@gmail.com",
    "name": "NEZ169"
  },
  {
    "dir": "Profile 97",
    "email": "juliaeka5568@gmail.com",
    "name": "NEZ170"
  },
  {
    "dir": "Profile 98",
    "email": "gayagamize@gmail.com",
    "name": "NEZ171"
  },
  {
    "dir": "Profile 99",
    "email": "innayacollection99@gmail.com",
    "name": "NEZ172"
  }
];
let chromeProfilesList = [...EMBEDDED_CHROME_PROFILES];
let activeProfileTargetAccountId = null;

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

function compareAccountNames(a, b) {
  const matchA = (a.name || '').match(/^Akun\s*(\d+)$/i);
  const matchB = (b.name || '').match(/^Akun\s*(\d+)$/i);
  if (matchA && matchB) {
    return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
  }
  if (matchA) return -1;
  if (matchB) return 1;
  return (a.name || a.email).localeCompare(b.name || b.email);
}

// Mengurutkan akun berdasarkan rekomendasi:
// 1. Akun siap pakai (ready) selalu di atas
// 2. Di antara yang ready: yang paling jarang digunakan (fresh / belum dipakai / terlama tidak dipakai) ada di paling kiri atas
// 3. Akun yang sedang limit/cooldown di bawahnya, diurutkan sisa waktu tercepat pulih
function sortAccountsByRecommendation(list) {
  return [...list].sort((a, b) => {
    // 1. Status Ready selalu di atas yang Cooldown / Locked
    if (a.status === 'ready' && b.status !== 'ready') return -1;
    if (a.status !== 'ready' && b.status === 'ready') return 1;

    // 2. Keduanya READY: urutkan berdasarkan kesegaran (Fresh / Jarang Digunakan)
    if (a.status === 'ready' && b.status === 'ready') {
      const usedA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
      const usedB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;

      // Belum pernah dipakai sama sekali -> paling atas (fresh)
      if (usedA === 0 && usedB !== 0) return -1;
      if (usedA !== 0 && usedB === 0) return 1;

      // Keduanya belum pernah dipakai -> urut nomor akun (Akun 1, Akun 2, ...)
      if (usedA === 0 && usedB === 0) {
        return compareAccountNames(a, b);
      }

      // Keduanya pernah dipakai -> yang terakhir dipakai paling lama (timestamp paling lampau) naik ke atas
      if (usedA !== usedB) {
        return usedA - usedB;
      }

      // Jika sama, akun dengan total pemakaian paling sedikit di atas
      const countA = a.useCount || 0;
      const countB = b.useCount || 0;
      if (countA !== countB) {
        return countA - countB;
      }

      return compareAccountNames(a, b);
    }

    // 3. Keduanya SEDANG LIMIT (Cooldown / Locked): urutkan sisa waktu tercepat pulih
    const resetA = a.resetAt ? new Date(a.resetAt).getTime() : Infinity;
    const resetB = b.resetAt ? new Date(b.resetAt).getTime() : Infinity;
    if (resetA !== resetB) {
      return resetA - resetB;
    }

    return compareAccountNames(a, b);
  });
}

function sortAccounts() {
  accounts.sort(compareAccountNames);
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


// --- Toast Alert dengan Tombol Undo ---
function showToastWithUndo(message, accountId, type = 'warning') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  let icon = '⚠️';
  if (type === 'warning') icon = '🛑';
  if (type === 'info') icon = 'ℹ️';
  if (type === 'success') icon = '✅';

  toast.innerHTML = `
    <span>${icon}</span>
    <span style="flex: 1; min-width: 0; word-break: break-word;">${message}</span>
    <button type="button" class="toast-undo-btn" onclick="resetToReady('${accountId}'); this.closest('.toast').remove();" title="Batalkan perubahan ini">
      ↩️ Batalkan (Undo)
    </button>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }
  }, 7000);
}

// --- History & Undo Management ---
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    actionHistory = raw ? JSON.parse(raw) : [];
  } catch (e) {
    actionHistory = [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(actionHistory));
  } catch (e) {
    console.warn('Failed to save history to localStorage:', e);
  }
}

function addHistoryEntry(entry) {
  const item = {
    id: 'h-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    time: new Date().toISOString(),
    ...entry
  };
  actionHistory.unshift(item);
  if (actionHistory.length > 50) {
    actionHistory = actionHistory.slice(0, 50);
  }
  saveHistory();
}

function clearHistoryLog() {
  if (confirm('Yakin ingin menghapus semua riwayat perubahan?')) {
    actionHistory = [];
    saveHistory();
    renderHistoryModal();
    showToast('Riwayat perubahan berhasil dibersihkan', 'info');
  }
}

function undoHistoryAction(historyId) {
  const entryIndex = actionHistory.findIndex(h => h.id === historyId);
  if (entryIndex === -1) return;
  const entry = actionHistory[entryIndex];

  if (!entry.prevState && !entry.deletedAccount) {
    showToast('Aksi ini tidak dapat dibatalkan secara otomatis', 'warning');
    return;
  }

  // Jika aksi adalah hapus akun: pulihkan akun tersebut
  if (entry.actionType === 'delete_account' && entry.deletedAccount) {
    accounts.push(entry.deletedAccount);
    sortAccounts();
    actionHistory.splice(entryIndex, 1);
    saveHistory();
    saveData();
    renderAll();
    renderHistoryModal();
    showToast(`✅ Akun "${entry.accountName || entry.accountEmail}" berhasil dipulihkan!`, 'success');
    return;
  }

  // Cari akun terkait
  const acc = accounts.find(a => a.id === entry.accountId || (entry.accountEmail && a.email.toLowerCase() === entry.accountEmail.toLowerCase()));

  if (!acc) {
    showToast('Akun terkait tidak ditemukan dalam daftar!', 'error');
    return;
  }

  // Restore status sebelumnya
  acc.status = entry.prevState.status || 'ready';
  acc.lockedAt = entry.prevState.lockedAt || null;
  acc.resetAt = entry.prevState.resetAt || null;
  acc.durationMs = entry.prevState.durationMs || 0;
  if (entry.prevState.lastUsedAt !== undefined) {
    acc.lastUsedAt = entry.prevState.lastUsedAt;
  }
  acc.notified = false;

  // Hapus entri history ini setelah di-undo
  actionHistory.splice(entryIndex, 1);
  saveHistory();

  saveData();
  renderAll();
  renderHistoryModal();

  showToast(`✅ Perubahan untuk "${acc.name || acc.email}" berhasil dibatalkan (Undo)!`, 'success');
}

function renderHistoryModal() {
  const container = document.getElementById('history-list');
  if (!container) return;

  if (actionHistory.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <span>Belum ada riwayat perubahan limit atau status.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = actionHistory.map(item => {
    let icon = '⚡';
    let badgeClass = 'sprint';
    let badgeLabel = 'Limit 5 Jam';

    if (item.actionType === 'weekly_limit') {
      icon = '🛑';
      badgeClass = 'weekly';
      badgeLabel = 'Limit 7 Hari';
    } else if (item.actionType === 'reset_ready') {
      icon = '🟢';
      badgeClass = 'ready';
      badgeLabel = 'Siap Pakai';
    } else if (item.actionType === 'adjust_time') {
      icon = '⚙️';
      badgeClass = 'sprint';
      badgeLabel = 'Atur Waktu';
    } else if (item.actionType === 'delete_account') {
      icon = '🗑️';
      badgeClass = 'weekly';
      badgeLabel = 'Hapus Akun';
    }

    const timeStr = formatRelativeOrDateTime(item.time);
    const canUndo = !!(item.prevState || item.deletedAccount);

    return `
      <div class="history-item">
        <div class="history-item-left">
          <div class="history-icon">${icon}</div>
          <div class="history-item-info">
            <div class="history-item-title">
              <span>${escapeHtml(item.accountName || item.accountEmail || 'Akun')}</span>
              <span class="history-badge ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="history-item-desc" title="${escapeHtml(item.desc || '')}">
              ${escapeHtml(item.desc || item.accountEmail || '')}
            </div>
            <div class="history-item-time">${timeStr}</div>
          </div>
        </div>
        ${canUndo ? `
          <button type="button" class="btn-history-undo" onclick="undoHistoryAction('${item.id}')" title="Kembalikan ke status sebelum perubahan ini">
            ↩️ Undo
          </button>
        ` : ''}
      </div>
    `;
  }).join('');
}

function formatRelativeOrDateTime(isoString) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);

  if (diffSec < 45) return 'Baru saja';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} menit yang lalu`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} jam yang lalu`;

  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${day} ${months[d.getMonth()]} pukul ${hours}:${mins}`;
}

// Kembalikan Akun ke Status Siap Pakai (Bisa Digunakan)
function resetToReady(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const prevState = {
    status: acc.status,
    lockedAt: acc.lockedAt,
    resetAt: acc.resetAt,
    durationMs: acc.durationMs,
    lastUsedAt: acc.lastUsedAt
  };

  acc.status = 'ready';
  acc.lockedAt = null;
  acc.resetAt = null;
  acc.durationMs = 0;
  acc.notified = false;

  addHistoryEntry({
    actionType: 'reset_ready',
    accountId: acc.id,
    accountName: acc.name,
    accountEmail: acc.email,
    desc: 'Limit dibatalkan, akun kembali ke status Siap Pakai',
    prevState
  });

  clearSortFreeze();
  saveData();
  renderAll();
  showToast(`🟢 Akun "${acc.name || acc.email}" berhasil dikembalikan ke Siap Pakai!`, 'success');
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
        } else if (Array.isArray(dbData) && dbData.length === 0 && accounts.length > 0) {
          // Sinkronkan akun dari localStorage ke database.json di server lokal
          saveData(true);
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
  fetchChromeProfiles();
  loadHistory();
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
  if (!rem || rem.expired) {
    return `
      <div class="cd-box-grid no-days">
        <div class="cd-col"><span class="cd-val">00</span><span class="cd-txt">Jam</span></div>
        <span class="cd-divider">:</span>
        <div class="cd-col"><span class="cd-val">00</span><span class="cd-txt">Mnt</span></div>
        <span class="cd-divider">:</span>
        <div class="cd-col"><span class="cd-val">00</span><span class="cd-txt">Dtk</span></div>
      </div>
    `;
  }
  
  const hStr = String(rem.hours).padStart(2, '0');
  const mStr = String(rem.minutes).padStart(2, '0');
  const sStr = String(rem.seconds).padStart(2, '0');

  if (rem.days > 0) {
    return `
      <div class="cd-box-grid">
        <div class="cd-col"><span class="cd-val">${rem.days}</span><span class="cd-txt">Hari</span></div>
        <span class="cd-divider">:</span>
        <div class="cd-col"><span class="cd-val">${hStr}</span><span class="cd-txt">Jam</span></div>
        <span class="cd-divider">:</span>
        <div class="cd-col"><span class="cd-val">${mStr}</span><span class="cd-txt">Mnt</span></div>
        <span class="cd-divider">:</span>
        <div class="cd-col"><span class="cd-val">${sStr}</span><span class="cd-txt">Dtk</span></div>
      </div>
    `;
  }

  return `
    <div class="cd-box-grid no-days">
      <div class="cd-col"><span class="cd-val">${hStr}</span><span class="cd-txt">Jam</span></div>
      <span class="cd-divider">:</span>
      <div class="cd-col"><span class="cd-val">${mStr}</span><span class="cd-txt">Mnt</span></div>
      <span class="cd-divider">:</span>
      <div class="cd-col"><span class="cd-val">${sStr}</span><span class="cd-txt">Dtk</span></div>
    </div>
  `;
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


// --- Sistem Penguncian Urutan Kartu (Freeze 1 Menit saat Kurangi Jam/Menyesuaikan Waktu) ---
let sortFrozenUntil = 0;
let frozenOrderIds = [];
let sortUnfreezeTimer = null;

function clearSortFreeze() {
  sortFrozenUntil = 0;
  frozenOrderIds = [];
  if (sortUnfreezeTimer) {
    clearTimeout(sortUnfreezeTimer);
    sortUnfreezeTimer = null;
  }
}

function restoreToRecommended() {
  if (searchQuery && searchQuery.trim()) {
    searchQuery = '';
    const searchInput = document.getElementById('search-input');
    const btnClear = document.getElementById('btn-clear-search');
    if (searchInput) searchInput.value = '';
    if (btnClear) btnClear.classList.remove('visible');
  }

  currentFilter = 'recommended';
  document.querySelectorAll('.filter-pills .pill').forEach(p => {
    if (p.getAttribute('data-filter') === 'recommended') {
      p.classList.add('active');
    } else {
      p.classList.remove('active');
    }
  });

  clearSortFreeze();
}

function triggerSortFreeze() {
  sortFrozenUntil = Date.now() + 60000; // Kunci urutan selama 60 detik (1 menit)

  // Ambil urutan kartu yang sedang tampil di layar saat ini
  const cards = document.querySelectorAll('.account-card');
  if (cards.length > 0) {
    frozenOrderIds = Array.from(cards).map(c => c.id.replace('card-', ''));
  } else if (frozenOrderIds.length === 0) {
    frozenOrderIds = accounts.map(a => a.id);
  }

  if (sortUnfreezeTimer) clearTimeout(sortUnfreezeTimer);
  sortUnfreezeTimer = setTimeout(() => {
    clearSortFreeze();
    renderCards();
    showToast('🔄 Posisi kartu diperbarui ke urutan terbaru', 'info');
  }, 60000);
}


// --- Sistem Smart Paste & Parser Waktu Antigravity ---
function parseAntigravityTime(rawText) {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = rawText.trim().toLowerCase();

  let days = 0;
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let hasMatch = false;

  // 1. Cek pola hari / days / d
  const dayMatch = text.match(/(\d+)\s*(?:days?|hari|d)\b/);
  if (dayMatch) {
    days = parseInt(dayMatch[1], 10);
    hasMatch = true;
  }

  // 2. Cek pola jam / hours / hrs / h
  const hourMatch = text.match(/(\d+)\s*(?:hours?|hrs?|jam|h)\b/);
  if (hourMatch) {
    hours = parseInt(hourMatch[1], 10);
    hasMatch = true;
  }

  // 3. Cek pola menit / minutes / mins / mnt / m
  const minMatch = text.match(/(\d+)\s*(?:minutes?|mins?|menit|mnt|m)\b/);
  if (minMatch) {
    minutes = parseInt(minMatch[1], 10);
    hasMatch = true;
  }

  // 4. Cek pola detik / seconds / secs / dtk / s
  const secMatch = text.match(/(\d+)\s*(?:seconds?|secs?|detik|dtk|s)\b/);
  if (secMatch) {
    seconds = parseInt(secMatch[1], 10);
    hasMatch = true;
  }

  // 5. Cek format jam:menit[:detik] misal "04:59" atau "1:23:45"
  if (!hasMatch) {
    const colonMatch = text.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/);
    if (colonMatch) {
      hours = parseInt(colonMatch[1], 10);
      minutes = parseInt(colonMatch[2], 10);
      if (colonMatch[3]) seconds = parseInt(colonMatch[3], 10);
      hasMatch = true;
    }
  }

  // 6. Cek format angka saja jika user cuma ketik misal "4" atau "3.5"
  if (!hasMatch) {
    const singleNum = text.match(/^(\d+(?:\.\d+)?)$/);
    if (singleNum) {
      const val = parseFloat(singleNum[1]);
      hours = Math.floor(val);
      minutes = Math.round((val - hours) * 60);
      hasMatch = true;
    }
  }

  if (!hasMatch) return null;

  const totalMs = (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
  if (totalMs <= 0) return null;

  // Jika ada setting hari atau total waktu > 6 jam, set limit mingguan (7 hari)
  // Jika <= 6 jam, set cooldown 5 jam
  const status = (days > 0 || totalMs > 6 * 3600 * 1000) ? 'weekly_locked' : 'sprint_cooldown';

  const parts = [];
  if (days > 0) parts.push(`${days} Hari`);
  if (hours > 0) parts.push(`${hours} Jam`);
  if (minutes > 0) parts.push(`${minutes} Menit`);
  if (seconds > 0) parts.push(`${seconds} Detik`);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalMs,
    status,
    description: parts.join(' ') || '0 Menit'
  };
}

function applyParsedTime(accountId, parsed) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const prevState = {
    status: acc.status,
    lockedAt: acc.lockedAt,
    resetAt: acc.resetAt,
    durationMs: acc.durationMs,
    lastUsedAt: acc.lastUsedAt
  };

  const now = new Date();
  const reset = new Date(now.getTime() + parsed.totalMs);

  acc.status = parsed.status;
  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = parsed.totalMs;
  acc.notified = false;
  acc.lastUsedAt = now.toISOString();
  acc.useCount = (acc.useCount || 0) + 1;

  addHistoryEntry({
    actionType: parsed.status === 'weekly_locked' ? 'weekly_limit' : 'sprint_limit',
    accountId: acc.id,
    accountName: acc.name,
    accountEmail: acc.email,
    desc: `Set dari Antigravity: ${parsed.description} (hingga ${formatDateTime(reset.toISOString())})`,
    prevState
  });

  // Kembalikan ke filter rekomendasi & bersihkan pencarian agar kartu yang baru di-paste
  // LANGSUNG TURUN ke daftar cooldown dan akun fresh siap pakai berikutnya langsung tampil di posisi #1
  restoreToRecommended();
  saveData();
  renderAll();
  showToastWithUndo(`✅ Berhasil set waktu: ${parsed.description} untuk "${acc.name || acc.email}"`, acc.id, 'success');
}

async function pasteFromAntigravity(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  let text = '';
  // 1. Coba baca langsung dari clipboard browser
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      text = await navigator.clipboard.readText();
    } catch (e) {
      console.warn('Clipboard read error or permission denied:', e);
    }
  }

  if (text) {
    const parsed = parseAntigravityTime(text);
    if (parsed) {
      applyParsedTime(accountId, parsed);
      return;
    }
  }

  // 2. Jika clipboard kosong atau format belum dikenali, tampilkan prompt paste cepat
  const manualText = prompt(
    `📋 Tempel (Paste) teks sisa waktu dari Antigravity untuk "${acc.name || acc.email}":\n\nContoh:\n• "in 4 hours, 59 minutes."\n• "it will fully refresh in 6 days, 7 hours."\n• atau ketik langsung "4:59" atau "4h 30m"`,
    text || ''
  );

  if (!manualText) return;

  const parsed = parseAntigravityTime(manualText);
  if (parsed) {
    applyParsedTime(accountId, parsed);
  } else {
    showToast('Format waktu tidak dikenali. Contoh: "4 hours, 59 minutes" atau "4:30"', 'warning');
  }
}

function applyCustomTime(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const input = document.getElementById(`time-input-${accountId}`);
  if (!input) return;

  const val = input.value.trim();
  if (!val) {
    showToast('Silakan ketik sisa waktu (contoh: 4h 59m atau 4:30)', 'warning');
    input.focus();
    return;
  }

  // Cek jika user ketik delta minus/plus seperti "-15m", "-1h", "+30m"
  if (val.startsWith('-') || val.startsWith('+')) {
    const isMinus = val.startsWith('-');
    const clean = val.replace(/^[+-]/, '').trim();
    const parsedDelta = parseAntigravityTime(clean);
    if (parsedDelta) {
      let currentMs = 0;
      if (acc.resetAt) {
        const diff = new Date(acc.resetAt).getTime() - Date.now();
        if (diff > 0) currentMs = diff;
      }
      const deltaMs = isMinus ? -parsedDelta.totalMs : parsedDelta.totalMs;
      const newMs = Math.max(0, currentMs + deltaMs);
      if (newMs <= 0) {
        resetToReady(accountId);
        return;
      }
      const reset = new Date(Date.now() + newMs);
      acc.status = newMs > 6 * 3600 * 1000 ? 'weekly_locked' : 'sprint_cooldown';
      acc.lockedAt = new Date().toISOString();
      acc.resetAt = reset.toISOString();
      acc.durationMs = newMs;
      acc.notified = false;
      triggerSortFreeze();
      saveData();
      renderAll();
      showToast(`⏱️ Waktu disesuaikan ${val} untuk "${acc.name || acc.email}"`, 'info');
      return;
    }
  }

  const parsed = parseAntigravityTime(val);
  if (parsed) {
    applyParsedTime(accountId, parsed);
  } else {
    showToast('Format waktu tidak valid! Contoh: 4h 59m, 4:59, atau 6d 7h', 'warning');
    input.focus();
  }
}

// --- Actions on Accounts ---

// 1. Kena Limit 5 Jam
function setSprintLimit(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const prevState = {
    status: acc.status,
    lockedAt: acc.lockedAt,
    resetAt: acc.resetAt,
    durationMs: acc.durationMs,
    lastUsedAt: acc.lastUsedAt
  };

  const now = new Date();
  const reset = new Date(now.getTime() + 5 * 3600 * 1000); // Tepat 5 Jam ke depan

  acc.status = 'sprint_cooldown';
  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = 5 * 3600 * 1000;
  acc.notified = false;
  acc.lastUsedAt = now.toISOString();
  acc.useCount = (acc.useCount || 0) + 1;

  addHistoryEntry({
    actionType: 'sprint_limit',
    accountId: acc.id,
    accountName: acc.name,
    accountEmail: acc.email,
    desc: `Limit 5 jam hingga ${formatDateTime(reset.toISOString())}`,
    prevState
  });

  restoreToRecommended();
  saveData();
  renderAll();
  showToastWithUndo(`🟡 Limit 5 jam diterapkan untuk "${acc.name || acc.email}".`, acc.id, 'warning');
}

// 2. Kena Limit Mingguan
function setWeeklyLimit(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const prevState = {
    status: acc.status,
    lockedAt: acc.lockedAt,
    resetAt: acc.resetAt,
    durationMs: acc.durationMs,
    lastUsedAt: acc.lastUsedAt
  };

  const now = new Date();
  const reset = new Date(now.getTime() + 7 * 24 * 3600 * 1000); // Tepat 7 Hari ke depan

  acc.status = 'weekly_locked';
  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = 7 * 24 * 3600 * 1000;
  acc.notified = false;
  acc.lastUsedAt = now.toISOString();
  acc.useCount = (acc.useCount || 0) + 1;

  addHistoryEntry({
    actionType: 'weekly_limit',
    accountId: acc.id,
    accountName: acc.name,
    accountEmail: acc.email,
    desc: `Limit mingguan 7 hari hingga ${formatDateTime(reset.toISOString())}`,
    prevState
  });

  restoreToRecommended();
  saveData();
  renderAll();
  showToastWithUndo(`🛑 Limit mingguan 7 hari diterapkan untuk "${acc.name || acc.email}".`, acc.id, 'warning');
}

// 3. Hapus Akun (Nomor urut otomatis kosong dan siap dipakai ulang!)
function deleteAccount(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const displayName = acc.name ? `${acc.name} (${acc.email})` : acc.email;
  if (confirm(`Yakin ingin menghapus akun "${displayName}"?`)) {
    const deletedAcc = { ...acc };
    accounts = accounts.filter(a => a.id !== accountId);

    addHistoryEntry({
      actionType: 'delete_account',
      accountId: deletedAcc.id,
      accountName: deletedAcc.name,
      accountEmail: deletedAcc.email,
      desc: `Akun "${displayName}" dihapus`,
      deletedAccount: deletedAcc
    });

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
  acc.lastUsedAt = now.toISOString();
  acc.useCount = (acc.useCount || 0) + 1;

  addHistoryEntry({
    actionType: 'adjust_time',
    accountId: acc.id,
    accountName: acc.name,
    accountEmail: acc.email,
    desc: `Waktu disetel ${targetHours} Jam (hingga ${formatDateTime(reset.toISOString())})`
  });

  restoreToRecommended();
  saveData();
  renderAll();
  showToast(`⚡ Hitung mundur disetel ke ${targetHours} Jam untuk "${acc.name || acc.email}"`, 'warning');
}


// Pintasan langsung set menit tertentu (misal: 30 Menit)
function quickSetMinutes(accountId, targetMinutes) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const prevState = {
    status: acc.status,
    lockedAt: acc.lockedAt,
    resetAt: acc.resetAt,
    durationMs: acc.durationMs,
    lastUsedAt: acc.lastUsedAt
  };

  const now = new Date();
  const totalMs = targetMinutes * 60 * 1000;
  const reset = new Date(now.getTime() + totalMs);

  acc.status = 'sprint_cooldown';
  acc.lockedAt = now.toISOString();
  acc.resetAt = reset.toISOString();
  acc.durationMs = totalMs;
  acc.notified = false;
  acc.lastUsedAt = now.toISOString();

  addHistoryEntry({
    actionType: 'adjust_time',
    accountId: acc.id,
    accountName: acc.name,
    accountEmail: acc.email,
    desc: `Waktu disetel ${targetMinutes} Menit (hingga ${formatDateTime(reset.toISOString())})`,
    prevState
  });

  restoreToRecommended();
  saveData();
  renderAll();
  showToast(`⚡ Hitung mundur disetel ke ${targetMinutes} Menit untuk "${acc.name || acc.email}"`, 'warning');
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
  acc.lastUsedAt = now.toISOString();
  acc.useCount = (acc.useCount || 0) + 1;

  restoreToRecommended();
  saveData();
  renderAll();
  showToast(`🛑 Hitung mundur disetel ke ${targetDays} Hari untuk "${acc.name || acc.email}"`, 'warning');
}

// Tambah / Kurang Jam Cepat (+1 Jam, -1 Jam, -2 Jam, dsb.)
function quickAdjustHours(accountId, deltaHours) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const prevState = {
    status: acc.status,
    lockedAt: acc.lockedAt,
    resetAt: acc.resetAt,
    durationMs: acc.durationMs,
    lastUsedAt: acc.lastUsedAt
  };

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
    clearSortFreeze();
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

  addHistoryEntry({
    actionType: 'adjust_time',
    accountId: acc.id,
    accountName: acc.name,
    accountEmail: acc.email,
    desc: `Waktu disesuaikan ${deltaHours > 0 ? '+' : ''}${deltaHours} Jam`,
    prevState
  });

  triggerSortFreeze();
  saveData();
  renderAll();
  showToast(`⏱️ Waktu dikurangi/ditambah ${deltaHours > 0 ? '+' : ''}${deltaHours} Jam untuk "${acc.name || acc.email}"`, 'info');
}

// Tambah / Kurang Hari Cepat (+1 Hari, -1 Hari, -2 Hari)
function quickAdjustDays(accountId, deltaDays) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const prevState = {
    status: acc.status,
    lockedAt: acc.lockedAt,
    resetAt: acc.resetAt,
    durationMs: acc.durationMs,
    lastUsedAt: acc.lastUsedAt
  };

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
    clearSortFreeze();
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

  addHistoryEntry({
    actionType: 'adjust_time',
    accountId: acc.id,
    accountName: acc.name,
    accountEmail: acc.email,
    desc: `Waktu disesuaikan ${deltaDays > 0 ? '+' : ''}${deltaDays} Hari`,
    prevState
  });

  triggerSortFreeze();
  saveData();
  renderAll();
  showToast(`⏱️ Waktu dikurangi/ditambah ${deltaDays > 0 ? '+' : ''}${deltaDays} Hari untuk "${acc.name || acc.email}"`, 'info');
}

// Tambah / Kurang Menit Cepat (-30 Mnt, -15 Mnt, -5 Mnt, +15 Mnt)
function quickAdjustMins(accountId, deltaMins) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const prevState = {
    status: acc.status,
    lockedAt: acc.lockedAt,
    resetAt: acc.resetAt,
    durationMs: acc.durationMs,
    lastUsedAt: acc.lastUsedAt
  };

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
    clearSortFreeze();
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

  addHistoryEntry({
    actionType: 'adjust_time',
    accountId: acc.id,
    accountName: acc.name,
    accountEmail: acc.email,
    desc: `Waktu disesuaikan ${deltaMins > 0 ? '+' : ''}${deltaMins} Menit`,
    prevState
  });

  triggerSortFreeze();
  saveData();
  renderAll();
  showToast(`⏱️ Waktu dikurangi/ditambah ${deltaMins > 0 ? '+' : ''}${deltaMins} Menit untuk "${acc.name || acc.email}"`, 'info');
}

// --- Render UI ---

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

// --- Pencocokan Otomatis Profil Google Chrome Berdasarkan Email ---
function findChromeProfileForEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Cari exact match email
  let match = chromeProfilesList.find(p => p.email && p.email.toLowerCase() === cleanEmail);
  if (match) return match;

  // 2. Cari fallback jika email diawali username
  const prefix = cleanEmail.split('@')[0];
  match = chromeProfilesList.find(p => p.name && p.name.toLowerCase() === prefix);
  if (match) return match;

  return null;
}

function renderCards() {
  const grid = document.getElementById('accounts-grid');
  const emptyState = document.getElementById('empty-state');
  if (!grid) return;

  let filtered = accounts.filter(acc => {
    // Jika ada kata kunci pencarian, cari di SEMUA akun
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEmail = acc.email.toLowerCase().includes(q);
      const matchName = (acc.name || '').toLowerCase().includes(q);
      return matchEmail || matchName;
    }

    if (currentFilter === 'ready' && acc.status !== 'ready') return false;
    if (currentFilter === 'sprint' && acc.status !== 'sprint_cooldown') return false;
    if (currentFilter === 'weekly' && acc.status !== 'weekly_locked') return false;

    return true;
  });

  if (accounts.length === 0) {
    grid.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Urutkan akun:
  if (currentFilter === 'all') {
    // Urut nomor akun: Akun 1, Akun 2, dst
    filtered.sort(compareAccountNames);
  } else {
    // Cek apakah posisi kartu sedang dikunci (freeze 1 menit saat sedang kurangi jam)
    const isFrozen = Date.now() < sortFrozenUntil && frozenOrderIds.length > 0;
    if (isFrozen) {
      // Pertahankan posisi kartu yang sedang tampil agar kartu TIDAK melompat saat tombol diklik!
      filtered.sort((a, b) => {
        const idxA = frozenOrderIds.indexOf(a.id);
        const idxB = frozenOrderIds.indexOf(b.id);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return 0;
      });
    } else {
      // Default & Rekomendasi: Akun Fresh / Jarang Digunakan di kiri atas!
      filtered = sortAccountsByRecommendation(filtered);
      if (!searchQuery.trim()) {
        frozenOrderIds = filtered.map(a => a.id);
      }
    }
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-dim);">
        Tidak ada akun yang sesuai dengan filter atau kata kunci pencarian.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((acc, index) => {
    const isReady = acc.status === 'ready';
    const isSprint = acc.status === 'sprint_cooldown';
    const isWeekly = acc.status === 'weekly_locked';

    // Akun teratas di paling kiri atas adalah Rekomendasi Utama
    const isTopRecommended = (currentFilter === 'recommended' || currentFilter === 'ready') && index === 0 && isReady;

    let statusClass = 'ready';
    let statusLabel = '🟢 BISA DIGUNAKAN';
    let cardClass = 'status-ready' + (isTopRecommended ? ' is-top-recommended' : '');

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

    // Cocokkan otomatis profil Google Chrome HANYA yang sesuai dengan Gmail akun ini
    const prof = findChromeProfileForEmail(acc.email);
    const chromeLabel = prof ? `Buka Chrome (${prof.name})` : 'Buka Chrome';

    return `
      <div class="account-card ${cardClass}" id="card-${acc.id}">
        <!-- 1. Header Bar: Nomor Akun, Tag Rekomendasi & Status Badge (Rapi Sejajar) -->
        <div class="card-header-bar">
          <div class="card-header-left">
            <span class="card-account-badge">${escapeHtml(acc.name || 'Akun')}</span>
            ${isTopRecommended ? `<span class="card-rec-top-badge" title="Akun paling fresh / terlama tidak digunakan. Pakai akun ini sekarang!">⭐ Rekomendasi Utama</span>` : ''}
          </div>
          <div class="status-badge ${statusClass}">
            <span class="dot"></span>
            <span>${statusLabel}</span>
          </div>
        </div>

        <!-- 2. Email Address (Jelas, Tebal, & Bersih) -->
        <div class="card-email-section">
          <span class="card-email-text" title="${escapeHtml(acc.email)}">${escapeHtml(acc.email)}</span>
        </div>

        <!-- 3. Action Toolbar (2 Tombol Proporsional Sejajar) -->
        <div class="card-actions-bar">
          <button type="button" class="btn-action-copy" onclick="copyEmail('${escapeHtml(acc.email)}')" title="Salin Email">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>Salin Email</span>
          </button>
          <button type="button" class="btn-action-chrome" onclick="openChromeForAccount('${acc.id}')" title="Klik langsung: Buka profil Chrome ${escapeHtml(prof ? prof.name : acc.email)}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="4"/>
              <line x1="21.17" y1="8" x2="12" y2="8"/>
              <line x1="3.95" y1="6.06" x2="8.54" y2="14"/>
              <line x1="10.88" y1="21.94" x2="15.46" y2="14"/>
            </svg>
            <span>${escapeHtml(chromeLabel)}</span>
          </button>
        </div>

        <!-- TEPAT SETELAH NAMA LABEL AKUN: KONTROL WAKTU / LIMIT -->
        ${isReady ? `
          <!-- Kondisi Siap Pakai: Smart Paste & Input Waktu Presisi Antigravity -->
          <div class="card-ready-box">
            <div class="ready-title">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span>Token Siap Digunakan</span>
            </div>
            <div class="ready-subtitle">
              Saat kuota habis, klik tombol tempel di bawah untuk menyamakan waktu dengan Antigravity secara instan:
            </div>

            <!-- 1. Tombol Utama: 1-Klik Tempel dari Antigravity -->
            <button type="button" class="btn-paste-primary" onclick="pasteFromAntigravity('${acc.id}')" title="1-Klik: Otomatis membaca teks sisa waktu yang kamu copy dari Antigravity">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              <span>📋 Tempel dari Antigravity</span>
            </button>

            <!-- 2. Input Manual Cepat -->
            <div class="smart-input-row">
              <input type="text" id="time-input-${acc.id}" class="smart-time-input" placeholder="Atau ketik: 4h 59m, 6d 7h, 4:59..." onkeydown="if(event.key==='Enter') applyCustomTime('${acc.id}')">
              <button type="button" class="btn-smart-submit" onclick="applyCustomTime('${acc.id}')" title="Mulai hitung mundur">Mulai</button>
            </div>

            <!-- 3. Preset Cepat -->
            <div class="quick-presets-strip">
              <button type="button" class="btn-preset-mini sprint" onclick="quickSetHours('${acc.id}', 5)" title="Reset ke 5 Jam penuh">⚡ 5 Jam Penuh</button>
              <button type="button" class="btn-preset-mini weekly" onclick="quickSetDays('${acc.id}', 7)" title="Reset ke 7 Hari penuh">🛑 7 Hari Penuh</button>
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

            <!-- Penyesuaian Akhir 5 Jam (Grid 4 Kolom Rapi & Simetris) -->
            <div class="click-adjust-section sprint">
              <div class="click-adjust-header">
                <span>⚡ Kurangi Waktu / Set Sisa:</span>
              </div>
              <div class="click-chips-grid">
                <button class="chip-btn minus" onclick="quickAdjustHours('${acc.id}', -2)" title="Kurangi 2 Jam">-2 Jam</button>
                <button class="chip-btn minus" onclick="quickAdjustHours('${acc.id}', -1)" title="Kurangi 1 Jam">-1 Jam</button>
                <button class="chip-btn minus" onclick="quickAdjustMins('${acc.id}', -30)" title="Kurangi 30 Menit">-30 Mnt</button>
                <button class="chip-btn minus" onclick="quickAdjustMins('${acc.id}', -15)" title="Kurangi 15 Menit">-15 Mnt</button>

                <button class="chip-btn highlight" onclick="quickSetHours('${acc.id}', 5)" title="Reset ke 5 Jam penuh">⚡ 5 Jam</button>
                <button class="chip-btn" onclick="quickSetHours('${acc.id}', 4)" title="Set sisa 4 Jam">4 Jam</button>
                <button class="chip-btn" onclick="quickSetHours('${acc.id}', 3)" title="Set sisa 3 Jam">3 Jam</button>
                <button class="chip-btn" onclick="quickSetHours('${acc.id}', 2)" title="Set sisa 2 Jam">2 Jam</button>

                <button class="chip-btn" onclick="quickSetHours('${acc.id}', 1)" title="Set sisa 1 Jam">1 Jam</button>
                <button class="chip-btn" onclick="quickSetMinutes('${acc.id}', 30)" title="Set sisa 30 Menit">30 Mnt</button>
                <button class="chip-btn minus" onclick="quickAdjustMins('${acc.id}', -5)" title="Kurangi 5 Menit">-5 Mnt</button>
                <button class="chip-btn plus" onclick="quickAdjustHours('${acc.id}', 1)" title="Tambah 1 Jam">+1 Jam</button>
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

            <!-- Penyesuaian Akhir 7 Hari (Grid 4 Kolom Rapi & Simetris) -->
            <div class="click-adjust-section weekly">
              <div class="click-adjust-header">
                <span>🛑 Kurangi Waktu / Set Sisa:</span>
              </div>
              <div class="click-chips-grid">
                <button class="chip-btn minus" onclick="quickAdjustDays('${acc.id}', -2)" title="Kurangi 2 Hari">-2 Hari</button>
                <button class="chip-btn minus" onclick="quickAdjustDays('${acc.id}', -1)" title="Kurangi 1 Hari">-1 Hari</button>
                <button class="chip-btn minus" onclick="quickAdjustHours('${acc.id}', -12)" title="Kurangi 12 Jam">-12 Jam</button>
                <button class="chip-btn minus" onclick="quickAdjustHours('${acc.id}', -6)" title="Kurangi 6 Jam">-6 Jam</button>

                <button class="chip-btn minus" onclick="quickAdjustHours('${acc.id}', -1)" title="Kurangi 1 Jam">-1 Jam</button>
                <button class="chip-btn minus" onclick="quickAdjustMins('${acc.id}', -30)" title="Kurangi 30 Menit">-30 Mnt</button>
                <button class="chip-btn plus" onclick="quickAdjustHours('${acc.id}', 1)" title="Tambah 1 Jam">+1 Jam</button>
                <button class="chip-btn plus" onclick="quickAdjustDays('${acc.id}', 1)" title="Tambah 1 Hari">+1 Hari</button>

                <button class="chip-btn highlight" onclick="quickSetDays('${acc.id}', 7)" title="Reset ke 7 Hari penuh">🛑 7 Hari</button>
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 6)" title="Set sisa 6 Hari">6 Hari</button>
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 5)" title="Set sisa 5 Hari">5 Hari</button>
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 4)" title="Set sisa 4 Hari">4 Hari</button>

                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 3)" title="Set sisa 3 Hari">3 Hari</button>
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 2)" title="Set sisa 2 Hari">2 Hari</button>
                <button class="chip-btn" onclick="quickSetDays('${acc.id}', 1)" title="Set sisa 1 Hari">1 Hari</button>
                <button class="chip-btn" onclick="quickSetHours('${acc.id}', 12)" title="Set sisa 12 Jam">12 Jam</button>
              </div>
            </div>
          </div>
          <div class="card-switch-limit">
            <button class="btn-switch-limit" onclick="setSprintLimit('${acc.id}')" title="Ganti ke Limit 5 Jam">
              ⚡ Ganti ke Limit 5 Jam &rarr;
            </button>
          </div>
        `}

        <!-- Card Footer: Bersih & Minimalis -->
        <div class="card-footer-clean">
          <span class="footer-acc-name">${escapeHtml(acc.name || 'Akun')}</span>
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


// --- Setup History Modal ---
function setupHistoryModal() {
  const btnHistory = document.getElementById('btn-history-menu');
  const modal = document.getElementById('history-modal');
  const btnClose = document.getElementById('btn-close-history');
  const btnCloseX = document.getElementById('btn-close-history-modal');
  const btnClear = document.getElementById('btn-clear-history');

  btnHistory?.addEventListener('click', () => {
    renderHistoryModal();
    modal?.classList.remove('hidden');
  });
  btnClose?.addEventListener('click', () => modal?.classList.add('hidden'));
  btnCloseX?.addEventListener('click', () => modal?.classList.add('hidden'));
  btnClear?.addEventListener('click', clearHistoryLog);
}

// --- Setup Event Listeners ---
function setupEventListeners() {
  setupBackupModal();
  setupHistoryModal();

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

      // Jika ada teks pencarian saat user klik filter pill, bersihkan pencarian
      if (searchQuery) {
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        updateClearButtonVisibility();
      }

      clearSortFreeze();
      renderCards();
    });
  });

  // Search box & Clear Button
  const searchInput = document.getElementById('search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');

  function updateClearButtonVisibility() {
    if (searchInput && btnClearSearch) {
      if (searchInput.value.trim().length > 0) {
        btnClearSearch.classList.add('visible');
      } else {
        btnClearSearch.classList.remove('visible');
      }
    }
  }

  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    updateClearButtonVisibility();

    // Jika user menghapus seluruh kata kunci pencarian (backspace sampai kosong)
    if (!searchQuery.trim()) {
      restoreToRecommended();
    }

    renderCards();
  });

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
      searchInput.blur();
    }
  });

  btnClearSearch?.addEventListener('click', (e) => {
    e.preventDefault();
    clearSearch();
  });

  // Minta izin notifikasi browser
  window.addEventListener('click', () => {
    requestNotificationPermission();
  }, { once: true });
}

// --- Fungsi Hapus Pencarian Cepat ---
function clearSearch() {
  restoreToRecommended();
  renderCards();
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
// --- Google Chrome Profile Launcher (100% Online via Protokol Windows) ---
function launchViaWindowsProtocol(profileDir) {
  const cleanDir = encodeURIComponent(profileDir);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = `agychrome://${cleanDir}/`;
  document.body.appendChild(iframe);
  setTimeout(() => iframe.remove(), 2500);
}

function openChromeForAccount(accountId) {
  const acc = accounts.find(a => a.id === accountId);
  if (!acc) return;

  const prof = findChromeProfileForEmail(acc.email);

  // Jika cocok dengan profil Chrome di laptop: langsung buka Chrome seketika!
  if (prof && prof.dir) {
    showToast(`🚀 Membuka Chrome profil "${prof.name}"...`, 'success');
    launchViaWindowsProtocol(prof.dir);
    return;
  }

  // Jika belum ada profil Chrome lokal untuk email ini: langsung buka Google Account Switcher di tab baru
  showToast(`🌐 Membuka Google Account Switcher untuk ${acc.email}...`, 'info');
  window.open(`https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(acc.email)}`, '_blank');
}

// --- Expose Global Functions to Window ---
window.handleSaveAccount = handleSaveAccount;
window.setSprintLimit = setSprintLimit;
window.setWeeklyLimit = setWeeklyLimit;
window.deleteAccount = deleteAccount;
window.copyEmail = copyEmail;
window.applyManualAdjustment = applyManualAdjustment;
window.quickSetHours = quickSetHours;
window.quickSetMinutes = quickSetMinutes;
window.pasteFromAntigravity = pasteFromAntigravity;
window.applyCustomTime = applyCustomTime;
window.parseAntigravityTime = parseAntigravityTime;
window.quickSetDays = quickSetDays;
window.quickAdjustHours = quickAdjustHours;
window.quickAdjustDays = quickAdjustDays;
window.quickAdjustMins = quickAdjustMins;
window.clearSearch = clearSearch;
window.openChromeForAccount = openChromeForAccount;
window.resetToReady = resetToReady;
window.undoHistoryAction = undoHistoryAction;
window.clearHistoryLog = clearHistoryLog;

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
