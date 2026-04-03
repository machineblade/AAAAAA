const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
const nav = document.getElementById('nav');
const videosGrid = document.getElementById('videosGrid');
const gamesGrid = document.getElementById('gamesGrid');

const videoModalOverlay = document.getElementById('videoModal');
const videoClose = document.getElementById('videoClose');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');

const gameModalOverlay = document.getElementById('gameModal');
const gameModalBox = document.getElementById('gameModalBox');
const gameClose = document.getElementById('gameClose');
const gameFrame = document.getElementById('gameFrame');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
});

window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
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
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';
        video.src = videoUrl;

        const cleanup = () => {
            video.removeAttribute('src');
            video.load();
        };

        video.addEventListener('loadeddata', () => {
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

        const html = [];

        for (const video of items) {
            let thumb = '';
            try {
                thumb = await captureFirstFrame(video.src);
            } catch { }

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

        videosGrid.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                modalVideo.src = card.dataset.src;
                modalTitle.textContent = card.dataset.title;
                videoModalOverlay.classList.add('open');
                modalVideo.play().catch(() => { });
            });
        });

        document.querySelectorAll('.video-card.reveal').forEach(el => observer.observe(el));
    } catch (error) {
        console.error(error);
        videosGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">Could not load videos.json</p>';
    }
}

async function loadGames() {
    try {
        const res = await fetch('./games.json');
        if (!res.ok) throw new Error(`games.json fetch failed: ${res.status}`);

        const games = await res.json();
        const items = Array.isArray(games) ? games : [];

        gamesGrid.innerHTML = items.map(game => `
      <div class="game-card reveal" data-url="/games/${game.folder}/index.html">
        <div class="game-card-thumb">
          ${game.image
                ? `<img class="game-card-img" src="${game.image}" alt="${game.title}">`
                : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#666;font-size:2rem;">🎮</div>`
            }
        </div>
        <div class="game-card-info">
          <h3>${game.title} <span style="color:var(--accent);">•</span> ${game.description || ''}</h3>
        </div>
      </div>
    `).join('') || '<p style="text-align:center;color:var(--muted);">No games found.</p>';

        gamesGrid.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const url = card.dataset.url;
                gameFrame.src = url;
                gameModalOverlay.classList.add('open');
                requestAnimationFrame(() => gameModalBox.classList.add('open'));
            });
        });

        document.querySelectorAll('.game-card.reveal').forEach(el => observer.observe(el));
    } catch (error) {
        console.error(error);
        gamesGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">Could not load games.json</p>';
    }
}

function closeVideoModal() {
    videoModalOverlay.classList.remove('open');
    modalVideo.pause();
    modalVideo.removeAttribute('src');
    modalVideo.load();
}

function closeGameModal() {
    gameModalBox.classList.remove('open');
    gameModalOverlay.classList.remove('open');
    setTimeout(() => {
        gameFrame.src = '';
    }, 250);
}

videoClose.addEventListener('click', closeVideoModal);
gameClose.addEventListener('click', closeGameModal);

videoModalOverlay.addEventListener('click', (e) => {
    if (e.target === videoModalOverlay) closeVideoModal();
});

gameModalOverlay.addEventListener('click', (e) => {
    if (e.target === gameModalOverlay) closeGameModal();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideoModal();
        closeGameModal();
    }
});

window.addEventListener('load', () => {
    loadVideos();
    loadGames();
});