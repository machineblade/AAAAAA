// ─── ELEMENTS ────────────────────────────────────────────────────────────────
const nav = document.getElementById('nav');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

const featuredCard = document.getElementById('featuredCard');
const featuredThumb = document.getElementById('featuredThumb');
const featuredTitle = document.getElementById('featuredTitle');
const featuredDesc = document.getElementById('featuredDesc');

const videosGrid = document.getElementById('videosGrid');
const gamesGrid = document.getElementById('gamesGrid');

const videoModal = document.getElementById('videoModal');
const videoClose = document.getElementById('videoClose');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');

const gameModal = document.getElementById('gameModal');
const gameModalBox = document.getElementById('gameModalBox');
const gameClose = document.getElementById('gameClose');
const gameFrame = document.getElementById('gameFrame');

const debugOverlay = document.getElementById('debugOverlay');
const debugToggle = document.getElementById('debugToggle');
const debugToggleMob = document.getElementById('debugToggleMobile');
const debugClose = document.getElementById('debugClose');
const debugContent = document.getElementById('debugContent');

// ─── STATE ───────────────────────────────────────────────────────────────────
let featuredGameUrl = '';
let debugOpen = false;
const log = { videosLoaded: 0, gamesLoaded: 0, videoNames: [], gameNames: [], errors: [] };

// ─── NAV ─────────────────────────────────────────────────────────────────────
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
});

// Close mobile menu when a link is clicked
mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
    });
});

window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    if (debugOpen) renderDebug();
}, { passive: true });

// ─── REVEAL ON SCROLL ─────────────────────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.08 });

function observeReveals() {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => revealObserver.observe(el));
}
observeReveals();

// ─── THUMBNAIL CAPTURE ────────────────────────────────────────────────────────
// Attempts to grab first frame from a video via canvas.
// Requires the server to send CORS headers (Access-Control-Allow-Origin: *)
// on the video files — add a vercel.json if needed.
function captureFirstFrame(src) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        const cleanup = () => { video.removeAttribute('src'); video.load(); };

        video.addEventListener('loadedmetadata', () => {
            video.currentTime = Math.min(1, video.duration / 4);
        }, { once: true });

        video.addEventListener('seeked', () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 360;
                canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
                cleanup();
                resolve(canvas.toDataURL('image/jpeg', 0.82));
            } catch (err) {
                cleanup();
                reject(err);
            }
        }, { once: true });

        video.addEventListener('error', () => { cleanup(); reject(new Error(`Cannot load ${src}`)); }, { once: true });

        video.src = src;
        video.load();
    });
}

function titleFromFilename(filename) {
    return filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
}

// ─── LOAD VIDEOS ─────────────────────────────────────────────────────────────
async function loadVideos() {
    try {
        const res = await fetch('./videos.json');
        if (!res.ok) throw new Error(`videos.json ${res.status}`);

        const files = await res.json();
        const items = (Array.isArray(files) ? files : [])
            .filter(f => f && f.url)
            .map(f => ({ file: f.url, src: f.url, title: f.name || titleFromFilename(f.url) }));

        log.videoNames = items.map(v => v.title);

        if (!items.length) {
            videosGrid.innerHTML = '<p class="empty-msg">No videos found.</p>';
            return;
        }

        videosGrid.innerHTML = '';

        for (const item of items) {
            // Build card immediately with placeholder
            const card = document.createElement('div');
            card.className = 'video-card reveal';
            card.dataset.src = item.src;
            card.dataset.title = item.title;
            card.innerHTML = `
        <div class="video-thumb">
          <span class="video-thumb-placeholder">🎬</span>
        </div>
        <div class="video-info">
          <h3>${item.title}</h3>
        </div>`;
            videosGrid.appendChild(card);
            revealObserver.observe(card);

            // Click to open modal
            card.addEventListener('click', () => openVideoModal(item.src, item.title));

            // Try to load thumbnail asynchronously — won't block rendering
            captureFirstFrame(item.src)
                .then(dataUrl => {
                    const thumb = card.querySelector('.video-thumb');
                    thumb.innerHTML = `<img src="${dataUrl}" alt="${item.title} thumbnail" loading="lazy">`;
                })
                .catch(err => {
                    log.errors.push(`thumb: ${item.file} — ${err.message}`);
                    if (debugOpen) renderDebug();
                });
        }

        log.videosLoaded = items.length;
        if (debugOpen) renderDebug();

    } catch (err) {
        console.error(err);
        log.errors.push(String(err.message || err));
        videosGrid.innerHTML = '<p class="error-msg">Could not load videos.json</p>';
        if (debugOpen) renderDebug();
    }
}

// ─── LOAD GAMES ──────────────────────────────────────────────────────────────
async function loadGames() {
    try {
        const res = await fetch('./games.json');
        if (!res.ok) throw new Error(`games.json ${res.status}`);

        const data = await res.json();
        const games = Array.isArray(data.games) ? data.games : [];
        const featured = data.featured || games[0] || null;

        log.gameNames = games.map(g => g.title || g.folder || '?');

        // Render featured
        if (featured) {
            featuredGameUrl = `/games/${featured.folder}/index.html`;
            featuredTitle.textContent = featured.title || 'Featured Game';
            featuredDesc.textContent = featured.description || '';
            featuredThumb.src = `/games/${featured.folder}/thumbnail.png`;
            featuredThumb.alt = `${featured.title} thumbnail`;
            featuredCard.addEventListener('click', () => openGameModal(featuredGameUrl));
        }

        // Render game cards
        if (!games.length) {
            gamesGrid.innerHTML = '<p class="empty-msg">No games found.</p>';
            return;
        }

        gamesGrid.innerHTML = '';
        games.forEach(game => {
            const url = `/games/${game.folder}/index.html`;
            const card = document.createElement('div');
            card.className = 'game-card reveal';
            card.innerHTML = `
        <div class="game-thumb">
          <img src="/games/${game.folder}/thumbnail.png" alt="${game.title} thumbnail" loading="lazy">
        </div>
        <div class="game-info">
          <h3>${game.title}</h3>
          <p>${game.description || ''}</p>
        </div>`;
            card.addEventListener('click', () => openGameModal(url));
            gamesGrid.appendChild(card);
            revealObserver.observe(card);
        });

        log.gamesLoaded = games.length;
        if (debugOpen) renderDebug();

    } catch (err) {
        console.error(err);
        log.errors.push(String(err.message || err));
        gamesGrid.innerHTML = '<p class="error-msg">Could not load games.json</p>';
        if (debugOpen) renderDebug();
    }
}

// ─── VIDEO MODAL ─────────────────────────────────────────────────────────────
function openVideoModal(src, title) {
    modalVideo.src = src;
    modalTitle.textContent = title;
    videoModal.classList.add('open');
    modalVideo.load();
    modalVideo.addEventListener('canplay', () => modalVideo.play().catch(() => { }), { once: true });
    if (debugOpen) renderDebug();
}

function closeVideoModal() {
    videoModal.classList.remove('open');
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
    if (debugOpen) renderDebug();
}

videoClose.addEventListener('click', closeVideoModal);
videoModal.addEventListener('click', e => { if (e.target === videoModal) closeVideoModal(); });

// ─── GAME MODAL ──────────────────────────────────────────────────────────────
function openGameModal(url) {
    gameFrame.src = url;
    gameModal.classList.add('open');
    if (debugOpen) renderDebug();
}

function closeGameModal() {
    gameModal.classList.remove('open');
    setTimeout(() => { gameFrame.src = ''; }, 260);
    if (debugOpen) renderDebug();
}

gameClose.addEventListener('click', closeGameModal);
gameModal.addEventListener('click', e => { if (e.target === gameModal) closeGameModal(); });

// ─── DEBUG ────────────────────────────────────────────────────────────────────
function renderDebug() {
    const lines = [
        `PAGE:        ${location.href}`,
        `TIME:        ${new Date().toLocaleString()}`,
        `VIEWPORT:    ${innerWidth} x ${innerHeight}`,
        `SCROLL Y:    ${Math.round(scrollY)}`,
        `VIDEOS:      ${log.videosLoaded}`,
        `GAMES:       ${log.gamesLoaded}`,
        `FEATURED:    ${featuredGameUrl || 'none'}`,
        `VIDEO MODAL: ${videoModal.classList.contains('open')}`,
        `GAME MODAL:  ${gameModal.classList.contains('open')}`,
        '',
        'DATA:',
        JSON.stringify(log, null, 2),
    ];
    debugContent.textContent = lines.join('\n');
}

function openDebug() { debugOpen = true; debugOverlay.classList.add('open'); renderDebug(); }
function closeDebug() { debugOpen = false; debugOverlay.classList.remove('open'); }
function toggleDebug(e) { e?.preventDefault(); debugOpen ? closeDebug() : openDebug(); }

debugToggle.addEventListener('click', toggleDebug);
debugToggleMob.addEventListener('click', toggleDebug);
debugClose.addEventListener('click', closeDebug);
debugOverlay.addEventListener('click', e => { if (e.target === debugOverlay) closeDebug(); });

window.addEventListener('resize', () => { if (debugOpen) renderDebug(); }, { passive: true });

// ─── KEYBOARD ─────────────────────────────────────────────────────────────────
window.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeVideoModal(); closeGameModal(); closeDebug(); }
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadVideos();
loadGames();