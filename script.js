const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const nav = document.getElementById('nav');
const videosGrid = document.getElementById('videosGrid');
const gamesGrid = document.getElementById('gamesGrid');

const featuredGameCard = document.getElementById('featuredGameCard');
const featuredGameThumb = document.getElementById('featuredGameThumb');
const featuredGameTitle = document.getElementById('featuredGameTitle');
const featuredGameDesc = document.getElementById('featuredGameDesc');

const videoModalOverlay = document.getElementById('videoModal');
const videoClose = document.getElementById('videoClose');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');

const gameModalOverlay = document.getElementById('gameModal');
const gameModalBox = document.getElementById('gameModalBox');
const gameClose = document.getElementById('gameClose');
const gameFrame = document.getElementById('gameFrame');

const debugToggle = document.getElementById('debugToggle');
const debugToggleMobile = document.getElementById('debugToggleMobile');
const debugOverlay = document.getElementById('debugOverlay');
const debugClose = document.getElementById('debugClose');
const debugContent = document.getElementById('debugContent');

let featuredGameUrl = '';
let debugOpen = false;
let debugData = {
    videosLoaded: 0,
    gamesLoaded: 0,
    videoNames: [],
    gameNames: [],
    errors: []
};

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
});

window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
    if (debugOpen) updateDebugInfo();
});

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), index * 100);
        }
    });
});

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

function titleFromFile(file) {
    return String(file || 'Untitled')
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ');
}

function captureFirstFrame(videoUrl) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;
        video.src = videoUrl;
        video.currentTime = 0.5;

        const cleanup = () => {
            video.removeAttribute('src');
            video.load();
        };

        video.addEventListener('seeked', () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 360;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumb = canvas.toDataURL('image/jpeg', 0.85);
                cleanup();
                resolve(thumb);
            } catch (err) {
                cleanup();
                reject(err);
            }
        }, { once: true });

        video.addEventListener('error', () => {
            cleanup();
            reject(new Error(`Failed to load ${videoUrl}`));
        }, { once: true });
    });
}

function renderFeaturedGame(game) {
    if (!game) return;

    featuredGameUrl = `/games/${game.folder}/index.html`;
    featuredGameTitle.textContent = game.title || 'Featured Game';
    featuredGameDesc.textContent = game.description || '';
    featuredGameThumb.src = `/games/${game.folder}/thumbnail.png`;
    featuredGameThumb.alt = `${game.title || 'Featured Game'} thumbnail`;
    featuredGameCard.dataset.url = featuredGameUrl;
}

function updateDebugInfo() {
    const videos = videosGrid ? videosGrid.querySelectorAll('.video-card').length : 0;
    const games = gamesGrid ? gamesGrid.querySelectorAll('.game-card').length : 0;

    const lines = [
        `PAGE: ${window.location.href}`,
        `TIME: ${new Date().toLocaleString()}`,
        `VIEWPORT: ${window.innerWidth} x ${window.innerHeight}`,
        `SCROLL Y: ${window.scrollY}`,
        `VIDEOS LOADED: ${videos}`,
        `GAMES LOADED: ${games}`,
        `FEATURED GAME URL: ${featuredGameUrl || 'none'}`,
        `NAV OPEN: ${mobileMenu.classList.contains('open')}`,
        `VIDEO MODAL OPEN: ${videoModalOverlay.classList.contains('open')}`,
        `GAME MODAL OPEN: ${gameModalOverlay.classList.contains('open')}`,
        `DEBUG OPEN: ${debugOpen}`,
        '',
        'DATA:',
        JSON.stringify(debugData, null, 2)
    ];

    debugContent.textContent = lines.join('\n');
}

function openDebug() {
    debugOpen = true;
    debugOverlay.classList.add('open');
    updateDebugInfo();
}

function closeDebug() {
    debugOpen = false;
    debugOverlay.classList.remove('open');
}

function toggleDebug(e) {
    if (e) e.preventDefault();
    if (debugOpen) closeDebug();
    else openDebug();
}

async function loadVideos() {
    try {
        const res = await fetch('./videos.json');
        if (!res.ok) throw new Error(`videos.json fetch failed: ${res.status}`);

        const files = await res.json();
        const items = (Array.isArray(files) ? files : [])
            .filter(file => typeof file === 'string' && file.trim())
            .map(file => ({
                file: file.trim(),
                src: `videos/${file.trim()}`,
                title: titleFromFile(file)
            }));

        debugData.videoNames = items.map(v => v.file);

        const html = [];

        for (const video of items) {
            let thumb = '';
            try {
                thumb = await captureFirstFrame(video.src);
            } catch (err) {
                debugData.errors.push(`thumbnail failed: ${video.src}`);
            }

            html.push(`
                <div class="video-card reveal" data-src="${video.src}" data-title="${video.title}">
                    <div class="video-card-thumb">
                        ${thumb
                    ? `<img class="video-card-img" src="${thumb}" alt="${video.title} thumbnail">`
                    : `<div style="font-size:3rem;padding:2rem;opacity:.2;">🎬</div>`
                }
                    </div>
                    <div class="video-card-info">
                        <h3>${video.title}</h3>
                        <div class="video-card-meta">
                            <span>${video.file}</span>
                            <span>•</span>
                            <span>from videos/</span>
                        </div>
                    </div>
                </div>
            `);
        }

        videosGrid.innerHTML = html.join('') || '<p style="text-align:center;color:var(--muted);">No videos found.</p>';
        debugData.videosLoaded = items.length;

        videosGrid.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                modalVideo.src = card.dataset.src;
                modalTitle.textContent = card.dataset.title;
                videoModalOverlay.classList.add('open');
                modalVideo.play().catch(() => { });
                if (debugOpen) updateDebugInfo();
            });
        });

        document.querySelectorAll('.video-card.reveal').forEach(el => observer.observe(el));
        if (debugOpen) updateDebugInfo();
    } catch (error) {
        console.error(error);
        debugData.errors.push(String(error.message || error));
        videosGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">Could not load videos.json</p>';
        if (debugOpen) updateDebugInfo();
    }
}

async function loadGames() {
    try {
        const res = await fetch('./games.json');
        if (!res.ok) throw new Error(`games.json fetch failed: ${res.status}`);

        const data = await res.json();
        const games = Array.isArray(data.games) ? data.games : [];

        debugData.gameNames = games.map(g => g.title || g.folder || 'Untitled');

        renderFeaturedGame(data.featured || games[0]);

        gamesGrid.innerHTML = games.map(game => `
            <div class="game-card reveal" data-url="/games/${game.folder}/index.html">
                <div class="game-card-thumb">
                    <img class="game-card-img" src="/games/${game.folder}/thumbnail.png" alt="${game.title} thumbnail">
                </div>
                <div class="game-card-info">
                    <h3>${game.title}</h3>
                    <p>${game.description || ''}</p>
                </div>
            </div>
        `).join('') || '<p style="text-align:center;color:var(--muted);">No games found.</p>';

        debugData.gamesLoaded = games.length;

        gamesGrid.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                gameFrame.src = card.dataset.url;
                gameModalOverlay.classList.add('open');
                requestAnimationFrame(() => gameModalBox.classList.add('open'));
                if (debugOpen) updateDebugInfo();
            });
        });

        featuredGameCard.addEventListener('click', () => {
            if (!featuredGameUrl) return;
            gameFrame.src = featuredGameUrl;
            gameModalOverlay.classList.add('open');
            requestAnimationFrame(() => gameModalBox.classList.add('open'));
            if (debugOpen) updateDebugInfo();
        });

        featuredGameCard.style.cursor = 'pointer';

        document.querySelectorAll('.game-card.reveal').forEach(el => observer.observe(el));
        if (debugOpen) updateDebugInfo();
    } catch (error) {
        console.error(error);
        debugData.errors.push(String(error.message || error));
        gamesGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">Could not load games.json</p>';
        if (debugOpen) updateDebugInfo();
    }
}

function closeVideoModal() {
    videoModalOverlay.classList.remove('open');
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
    if (debugOpen) updateDebugInfo();
}

function closeGameModal() {
    gameModalBox.classList.remove('open');
    gameModalOverlay.classList.remove('open');
    setTimeout(() => {
        gameFrame.src = '';
    }, 250);
    if (debugOpen) updateDebugInfo();
}

videoClose.addEventListener('click', closeVideoModal);
gameClose.addEventListener('click', closeGameModal);

videoModalOverlay.addEventListener('click', (e) => {
    if (e.target === videoModalOverlay) closeVideoModal();
});

gameModalOverlay.addEventListener('click', (e) => {
    if (e.target === gameModalOverlay) closeGameModal();
});

debugToggle.addEventListener('click', toggleDebug);
debugToggleMobile.addEventListener('click', toggleDebug);
debugClose.addEventListener('click', closeDebug);

debugOverlay.addEventListener('click', (e) => {
    if (e.target === debugOverlay) closeDebug();
});

window.addEventListener('resize', () => {
    if (debugOpen) updateDebugInfo();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideoModal();
        closeGameModal();
        closeDebug();
    }
});

window.addEventListener('load', () => {
    loadVideos();
    loadGames();
});