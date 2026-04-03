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

let featuredGameUrl = '';

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

function youtubeEmbedUrl(id) {
    return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
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

async function loadVideos() {
    try {
        const res = await fetch('./videos.json');
        if (!res.ok) throw new Error(`videos.json fetch failed: ${res.status}`);

        const items = await res.json();
        const videos = Array.isArray(items) ? items : [];

        const html = videos.map(video => {
            const file = typeof video.file === 'string' ? video.file.trim() : 'video.mp4';
            const id = typeof video.id === 'string' ? video.id.trim() : '';
            const title = titleFromFile(file);
            return `
                <div class="video-card reveal" data-video-id="${id}" data-title="${title}">
                    <div class="video-card-thumb">
                        <div style="font-size:3rem;padding:2rem;opacity:.2;">▶</div>
                    </div>
                    <div class="video-card-info">
                        <h3>${title}</h3>
                        <div class="video-card-meta">
                            <span>${file}</span>
                            <span>•</span>
                            <span>YouTube Unlisted</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        videosGrid.innerHTML = html || '<p style="text-align:center;color:var(--muted);">No videos found.</p>';

        videosGrid.querySelectorAll('.video-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.videoId;
                if (!id) return;

                modalVideo.src = youtubeEmbedUrl(id);
                modalTitle.textContent = card.dataset.title;
                videoModalOverlay.classList.add('open');
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

        const data = await res.json();
        const games = Array.isArray(data.games) ? data.games : [];

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

        gamesGrid.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                gameFrame.src = card.dataset.url;
                gameModalOverlay.classList.add('open');
                requestAnimationFrame(() => gameModalBox.classList.add('open'));
            });
        });

        featuredGameCard.addEventListener('click', () => {
            if (!featuredGameUrl) return;
            gameFrame.src = featuredGameUrl;
            gameModalOverlay.classList.add('open');
            requestAnimationFrame(() => gameModalBox.classList.add('open'));
        });

        featuredGameCard.style.cursor = 'pointer';

        document.querySelectorAll('.game-card.reveal').forEach(el => observer.observe(el));
    } catch (error) {
        console.error(error);
        gamesGrid.innerHTML = '<p style="text-align:center;color:var(--muted);">Could not load games.json</p>';
    }
}

function closeVideoModal() {
    videoModalOverlay.classList.remove('open');
    modalVideo.removeAttribute('src');
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