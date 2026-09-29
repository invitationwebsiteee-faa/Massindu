// ===== PENGATURAN =====
const CONFIG = {
  passcode: '1003',   // ganti passcode (4 angka)
  volume: 0.6,        // volume musik normal (0-1)
  videoVolume: 0.1,     // volume musik saat video diputar: 0 = mati, 0.1 = kecil
};

// ===== ELEMEN =====
const $ = (s) => document.querySelector(s);
const bgm = $('#bgm'), vid = $('#vid'), muteBtn = $('#mute');
const pages = [...document.querySelectorAll('.page')];
const MAIN = 7;   // halaman utama = 1-7; halaman 8+ adalah halaman tambahan dari kado
let current = 1, muted = false, code = '', unlocked = false, blown = false;
bgm.volume = CONFIG.volume;

// ===== NAVIGASI =====
function go(n) {
  if (n === 1 && current !== 1) {                   // kembali ke awal: reset semuanya
    unlocked = false; blown = false; code = '';
    setTimeout(resetView, 800);                    // tunggu animasi geser selesai
  }
  pages.forEach((p, i) => {                        // atas / aktif / bawah -> dipakai animasi CSS
    p.classList.toggle('above', i + 1 < n);
    p.classList.toggle('active', i + 1 === n);
    p.classList.toggle('below', i + 1 > n);
  });
  if (current === 6 && n !== 6) vid.pause();       // musik kembali lewat event "pause" video
  if (current === 8 && n !== 8) setTimeout(resetGame, 800);   // hentikan game saat keluar
  if (n === MAIN) setTimeout(() => setStage(1), 900);          // halaman surat: foto pertama muncul otomatis
  if (current === MAIN && n !== MAIN) setTimeout(() => setStage(0), 800);
  current = n;
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-go]');
  if (!t || t.dataset.busy) return;
  t.dataset.busy = 1;
  const gift = t.classList.contains('gift');
  t.classList.add(gift ? 'picked' : 'pop');        // animasi klik
  if (gift) {
    confetti();
    document.querySelectorAll('.gift').forEach((g) => g !== t && g.classList.add('dim'));
  }
  setTimeout(() => {
    go(+t.dataset.go);
    delete t.dataset.busy;
    setTimeout(() => document.querySelectorAll('.gift').forEach((g) => g.classList.remove('picked', 'dim')), 1000);
    t.classList.remove('pop');
  }, gift ? 900 : 250);
});

// ===== MUSIK =====
function playMusic() { if (!muted) bgm.play().catch(() => {}); }
muteBtn.onclick = () => {
  muted = !muted;
  muteBtn.textContent = muted ? '🔇' : '🔊';
  if (muted) bgm.pause();
  else if (vid.paused) { bgm.volume = CONFIG.volume; playMusic(); }
};

// Musik mengecil pelan saat video diputar, dan naik lagi saat video berhenti
let fadeTimer;
function fadeTo(target, ms, done) {
  clearInterval(fadeTimer);
  const start = bgm.volume, steps = 20;
  let i = 0;
  fadeTimer = setInterval(() => {
    i++;
    bgm.volume = Math.min(1, Math.max(0, start + (target - start) * i / steps));
    if (i >= steps) { clearInterval(fadeTimer); if (done) done(); }
  }, ms / steps);
}
// iPhone/iPad tidak mengizinkan volume diubah lewat kode -> di sana musik cukup di-pause saat video
const canFade = (() => { const a = new Audio(); a.volume = 0.5; return a.volume === 0.5; })();
function duckMusic() {
  if (!canFade) { bgm.pause(); return; }
  fadeTo(CONFIG.videoVolume, 600, () => { if (CONFIG.videoVolume === 0) bgm.pause(); });
}
function restoreMusic() {
  if (muted) return;
  if (bgm.paused) bgm.play().catch(() => {});
  if (canFade) fadeTo(CONFIG.volume, 800);
}
vid.addEventListener('play', duckMusic);
vid.addEventListener('pause', restoreMusic);
vid.addEventListener('ended', restoreMusic);

// ===== PASSCODE =====
const dots = () => document.querySelectorAll('#dots i').forEach((d, i) => d.classList.toggle('on', i < code.length));
['1','2','3','4','5','6','7','8','9','','0','⌫'].forEach((k) => {
  const b = document.createElement('button');
  b.textContent = k;
  b.onclick = () => press(k);
  $('#keys').append(b);
});
function press(k) {
  if (!k) return;
  playMusic();                                     // klik pertama = izin browser untuk musik
  code = k === '⌫' ? code.slice(0, -1) : (code + k).slice(0, 4);
  dots();
  if (code.length < 4) return;
  if (code === CONFIG.passcode) { unlocked = true; muteBtn.hidden = false; go(2); return; }
  const lock = $('#p1 .lock');
  lock.classList.add('shake');
  setTimeout(() => { lock.classList.remove('shake'); code = ''; dots(); }, 400);
}

// ===== TIUP LILIN =====
$('#blow').onclick = () => {
  blown = true;
  $('#cake').classList.add('out');
  $('#wishText').textContent = 'happy birthday sayanggg❤️';
  $('#blow').hidden = true;
  $('#wishNext').hidden = false;
  confetti();
};
function confetti() {
  for (let i = 0; i < 24; i++) {
    const s = document.createElement('span');
    s.className = 'fx';
    s.textContent = ['🤎', '✨', '🍂'][i % 3];
    s.style.left = Math.random() * 100 + 'vw';
    s.style.animationDuration = 2 + Math.random() * 2 + 's';
    document.body.append(s);
    setTimeout(() => s.remove(), 4500);
  }
}

// ===== AMPLOP =====
$('#env').onclick = () => $('#env').classList.toggle('open');

// ===== SCROLL / SWIPE / KEYBOARD =====
let busy = false;

// Halaman surat: tiap scroll memunculkan 1 foto, lalu suratnya (tanpa pindah halaman)
const shots = [...document.querySelectorAll('.strip img')];
const LAST_STAGE = shots.length + 1;               // 3 foto + 1 surat = 4 tahap
let stage = 0;
function setStage(n) {
  stage = n;
  shots.forEach((img, i) => img.classList.toggle('show', i < n));
  $('#letterBox').classList.toggle('show', n >= LAST_STAGE);
}

function step(dir) {
  if (busy) return;
  if (current === MAIN && (dir > 0 || stage > 1)) {   // di halaman surat: scroll = munculkan / sembunyikan
    const next = stage + dir;
    if (next >= 1 && next <= LAST_STAGE) { busy = true; setTimeout(() => (busy = false), 600); setStage(next); }
    return;
  }
  const n = current + dir;
  if (busy || current > MAIN || n < (unlocked ? 2 : 1) || n > MAIN) return;
  if (dir > 0 && current === 3 && opened.size < 3) { setHint('Buka semua kado dulu ya 🎁'); nudge(); return; }
  if (dir > 0 && ((current === 1 && !unlocked) || (current === 4 && !blown))) return;  // harus buka kunci / tiup lilin dulu
  busy = true; setTimeout(() => (busy = false), 800);
  go(n);
}
addEventListener('wheel', (e) => {
  if (!e.target.closest('.letter') && Math.abs(e.deltaY) > 20) step(e.deltaY > 0 ? 1 : -1);
}, { passive: true });
let y0 = 0;
addEventListener('touchstart', (e) => (y0 = e.touches[0].clientY), { passive: true });
addEventListener('touchend', (e) => {
  const d = y0 - e.changedTouches[0].clientY;
  if (!e.target.closest('.letter') && Math.abs(d) > 50) step(d > 0 ? 1 : -1);
});
addEventListener('keydown', (e) => {
  if (['ArrowDown', 'PageDown'].includes(e.key)) step(1);
  if (['ArrowUp', 'PageUp'].includes(e.key)) step(-1);
});
// ===== MINI GAME: TANGKAP HATI =====
const arena = $('#arena'), info = $('#gameInfo'), startBtn = $('#gameStart');
let score = 0, timeLeft = 0, spawner, timer;
const status = () => (info.textContent = `Skor: ${score}  |  Waktu: ${timeLeft}`);

function startGame() {
  score = 0; timeLeft = 15;
  arena.innerHTML = '';
  startBtn.hidden = true;
  status();
  spawner = setInterval(spawnHeart, 600);
  timer = setInterval(() => { timeLeft--; status(); if (timeLeft <= 0) endGame(); }, 1000);
}
function spawnHeart() {
  const h = document.createElement('button');
  h.className = 'heart';
  h.textContent = ['🤎', '🧡', '💛'][Math.floor(Math.random() * 3)];
  h.style.left = Math.random() * 85 + '%';
  h.style.top = Math.random() * 80 + '%';
  h.onclick = () => { score++; status(); h.remove(); };
  arena.append(h);
  setTimeout(() => h.remove(), 1200);
}
function endGame() {
  clearInterval(spawner); clearInterval(timer);
  arena.innerHTML = '';
  info.textContent = score >= 12 ? `Skor ${score}! Hebat banget 🎉` : `Skor ${score}. Coba lagi yuk!`;
  startBtn.textContent = 'MAIN LAGI';
  startBtn.hidden = false;
}
function resetGame() {
  clearInterval(spawner); clearInterval(timer);
  arena.innerHTML = '';
  info.textContent = 'Tap hati sebanyak mungkin dalam 15 detik';
  startBtn.textContent = 'MULAI';
  startBtn.hidden = false;
}
startBtn.onclick = startGame;

// ===== KADO: HARUS DIBUKA SEMUA SEBELUM LANJUT =====
const opened = new Set();
function setHint(msg) { $('#giftHint').textContent = `${msg} (${opened.size}/3 kado terbuka)`; }
function nudge() {                                 // goyang tulisan petunjuk
  const h = $('#giftHint');
  h.classList.remove('shake'); void h.offsetWidth; h.classList.add('shake');
}
document.querySelectorAll('.gift').forEach((g, i) => g.addEventListener('click', () => {
  if (opened.has(i + 1)) return;
  opened.add(i + 1);
  g.classList.add('opened');
  if (i === 0) { g.classList.add('wiggle'); confetti(); }   // kado 1: ucapan
  setHint(g.dataset.msg);
  if (opened.size === 3) $('#giftNext').hidden = false;      // semua terbuka -> tombol NEXT muncul
}));

// ===== KADO 3: BALON BERISI FOTO =====
const BALLOONS = [                                // path foto balon (folder kamu bernama "asset")
  'asset/balon 1.jpg',
  'asset/balon 2.jpg',
  'asset/2.jpg',
];
const BALLOON_COLORS = ['#fef727', '#d10026', '#00d107'];
$('[data-balloons]').addEventListener('click', (e) => {
  const gift = e.currentTarget;
  if (gift.dataset.done) return;
  gift.dataset.done = 1;
  gift.classList.add('wiggle');
  confetti();
  const r = gift.getBoundingClientRect();
  const left = r.left + r.width / 2 - 45, top = r.top + r.height / 2 - 55;   // balon mulai dari tengah kotak
  BALLOONS.forEach((src, i) => {
    const b = document.createElement('button');
    b.className = 'balloon';
    b.style.cssText = `left:${left}px;top:${top}px;--c:${BALLOON_COLORS[i]}`;
    b.innerHTML = `<img src="${src}" alt="">`;
    b.firstChild.onerror = (ev) => {               // foto tidak ketemu -> balon kosong + pesan di Console
      console.warn('Foto balon tidak ditemukan:', src);
      ev.target.replaceWith(Object.assign(document.createElement('span'), { textContent: '🎈' }));
    };
    const home = `${innerWidth * (0.25 + 0.25 * i) - (left + 45)}px ${innerHeight * (i === 1 ? 0.14 : 0.2) - top}px`;
    b.onclick = () => {                            // tap balon = perbesar / kecilkan
      const on = b.classList.toggle('zoom');
      b.style.translate = on ? `${innerWidth / 2 - (left + 45)}px ${innerHeight / 2 - (top + 55)}px` : home;
    };
    $('#sky').append(b);
    setTimeout(() => { b.style.translate = home; b.classList.add('up'); }, 500 + i * 250);
  });
});

function resetView() {                             // kembalikan tampilan seperti awal
  dots();
  $('#cake').classList.remove('out');
  $('#wishText').textContent = 'Make a wish';
  $('#blow').hidden = false;
  $('#wishNext').hidden = true;
  $('#env').classList.remove('open');
  opened.clear();                                  // semua kado tertutup lagi
  document.querySelectorAll('.gift').forEach((g) => g.classList.remove('opened', 'wiggle'));
  $('#giftNext').hidden = true;
  $('#sky').innerHTML = '';                        // balon kado 3
  const g3 = $('[data-balloons]');
  g3.classList.remove('wiggle'); delete g3.dataset.done;
  $('#giftHint').textContent = 'click any gift to open';
}
go(1);
