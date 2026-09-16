/**
 * Mini Backend Server untuk Antigravity Token Tracker
 * Menyimpan data akun langsung ke file database lokal (database.json)
 * dan menyajikan antarmuka web tanpa perlu instalasi npm tambahan.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3333;
const DB_FILE = path.join(__dirname, 'database.json');

// Menemukan lokasi chrome.exe di Windows
function getChromeExecutable() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return 'chrome';
}

// Membaca profil Chrome dari Local State Windows
function getChromeProfiles() {
  const localStatePath = path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data', 'Local State');
  if (!fs.existsSync(localStatePath)) return [];
  try {
    const raw = fs.readFileSync(localStatePath, 'utf8');
    const data = JSON.parse(raw);
    const infoCache = data?.profile?.info_cache || {};
    const list = [];
    for (const [dir, info] of Object.entries(infoCache)) {
      list.push({
        dir,
        email: (info.user_name || info.userName || '').trim().toLowerCase(),
        name: info.name || dir,
        gaiaId: info.gaia_id || ''
      });
    }
    return list;
  } catch (e) {
    console.error('Error membaca Chrome profiles:', e.message);
    return [];
  }
}

// Pastikan file database.json ada
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf8');
}

function getDatabase() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function saveDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (e) {
    console.error('Gagal menulis database:', e);
    return false;
  }
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // CORS Headers (Mendukung localhost dan GitHub Pages via Private Network Access)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Request-Private-Network');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // --- REST API Endpoints ---
  if (pathname === '/api/accounts') {
    // 1. GET: Ambil semua akun dari database.json
    if (req.method === 'GET') {
      const data = getDatabase();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    // 2. POST: Simpan seluruh data akun ke database.json
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (Array.isArray(parsed)) {
            saveDatabase(parsed);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: parsed.length }));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Body harus berupa array akun' }));
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'JSON tidak valid' }));
        }
      });
      return;
    }
  }

  // 3. GET /api/chrome-profiles: Daftar semua profil Chrome yang ditemukan
  if (pathname === '/api/chrome-profiles' && req.method === 'GET') {
    const profiles = getChromeProfiles();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, count: profiles.length, profiles }));
    return;
  }

  // 4. POST /api/open-chrome: Luncurkan Chrome dengan profil akun yang ditentukan
  if (pathname === '/api/open-chrome' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { email, profileDir, targetUrl } = JSON.parse(body || '{}');
        const profiles = getChromeProfiles();
        let matched = null;

        if (profileDir) {
          matched = profiles.find(p => p.dir.toLowerCase() === profileDir.toLowerCase());
        }

        if (!matched && email) {
          const cleanEmail = email.trim().toLowerCase();
          matched = profiles.find(p => p.email === cleanEmail);
          if (!matched) {
            // Pencocokan cadangan berdasarkan prefix username jika profil dinamai sesuai username
            const emailPrefix = cleanEmail.split('@')[0];
            matched = profiles.find(p => p.name.toLowerCase() === emailPrefix || p.email.startsWith(emailPrefix));
          }
        }

        if (!matched && !profileDir) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Profil Chrome tidak ditemukan secara otomatis untuk email ini.',
            matched: false,
            availableProfiles: profiles.map(p => ({ dir: p.dir, name: p.name, email: p.email }))
          }));
          return;
        }

        const chromeExe = getChromeExecutable();
        const targetDir = matched ? matched.dir : profileDir;
        const targetName = matched ? matched.name : profileDir;
        const args = [`--profile-directory=${targetDir}`];

        if (targetUrl) {
          args.push(targetUrl);
        }

        const child = spawn(chromeExe, args, {
          detached: true,
          stdio: 'ignore'
        });
        child.unref();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          profileDir: targetDir,
          profileName: targetName,
          email: matched ? matched.email : (email || ''),
          matched: !!matched
        }));
      } catch (err) {
        console.error('Error launching Chrome:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // --- Static File Server ---
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Cegah cache agar browser selalu memuat kode terbaru
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Antigravity Token Tracker Backend Server Berjalan!`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  File Database: ${DB_FILE}`);
  console.log(`======================================================\n`);
});
