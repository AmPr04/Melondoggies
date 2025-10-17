// Minimal JS to populate posts and a playlist, handle search and audio playback
const posts = [
  {
    id: 1,
    title: 'Melancholy at Bar Sinister',
    excerpt: 'This Saturday see Melancholy at Bar Sinister. Bring your best black clothes.',
    date: '2025-10-17'
  },
  {
    id: 2,
    title: 'Top Melancholy tracks to headbang to',
    excerpt: 'Curated upbeat tracks to thrash around to.',
    date: '2025-08-15'
  },
  {
    id: 3,
    title: 'Album review: Eris',
    excerpt: 'A deep dive into the textures and motifs of the new release.',
    date: '2025-09-01'
  }
];

const playlist = [
  { id: 't1', title: 'VIP', src: 'https://open.spotify.com/track/6yUKgDm2hKR04i683jyI9E?si=385afd4d70bf4ba7', artist: 'Melancholy' },
  { id: 't2', title: 'Eris', src: 'https://open.spotify.com/track/1hkeOMjQBepbab9gFcJMbK?si=b1da8ddb89bf42fa', artist: 'Melancholy' },
  { id: 't3', title: 'Amy', src: 'media/soft-morning.mp3', artist: 'Melancholy' },
];

// Vinyls use the same tracks for demonstration; you can map different previews/full tracks
const vinyls = playlist.map(t => ({ ...t, preview: t.src }));

function el(q) { return document.querySelector(q); }

function renderPosts(list) {
  const container = el('#posts-list');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<p class="muted">No posts found.</p>';
    return;
  }
  list.forEach(p => {
    const div = document.createElement('article');
    div.className = 'post';
    div.innerHTML = `<h3>${p.title}</h3><p>${p.excerpt}</p><div class="meta">${p.date}</div>
      <div class="post-actions"><button class="edit-post" data-id="${p.id}">Edit</button> <button class="delete-post" data-id="${p.id}">Delete</button></div>`;
    container.appendChild(div);
  });

  // wire post action buttons
  container.querySelectorAll('.edit-post').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      startEditPost(id);
    });
  });
  container.querySelectorAll('.delete-post').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      deletePost(id);
    });
  });
}

/* --- CRUD (localStorage-backed) for posts --- */
const STORAGE_KEY = 'fanpage_posts_v1';

function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...posts]; // fallback to initial sample posts
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error('Failed to load posts', e);
    return [...posts];
  }
}

function savePosts(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save posts', e);
  }
}

function createPost(data) {
  const list = loadPosts();
  const id = 'p' + Date.now();
  const newPost = { id, title: data.title || 'Untitled', excerpt: data.excerpt || '', date: data.date || new Date().toISOString().slice(0,10) };
  list.unshift(newPost);
  savePosts(list);
  renderPosts(list);
}

function updatePost(id, data) {
  const list = loadPosts();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], ...data };
  savePosts(list);
  renderPosts(list);
}

function deletePost(id) {
  if (!confirm('Delete this post?')) return;
  let list = loadPosts();
  list = list.filter(p => p.id !== id);
  savePosts(list);
  renderPosts(list);
}

let editingId = null;

function startEditPost(id) {
  const list = loadPosts();
  const p = list.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  el('#post-title').value = p.title;
  el('#post-date').value = p.date;
  el('#post-excerpt').value = p.excerpt;
  el('#post-save').textContent = 'Save Changes';
}

function resetEditor() {
  editingId = null;
  el('#post-title').value = '';
  el('#post-date').value = '';
  el('#post-excerpt').value = '';
  el('#post-save').textContent = 'Create Post';
}

function initEditor() {
  const save = el('#post-save');
  const cancel = el('#post-cancel');
  save.addEventListener('click', () => {
    const title = el('#post-title').value.trim();
    const date = el('#post-date').value;
    const excerpt = el('#post-excerpt').value.trim();
    if (!title) return alert('Please provide a title');
    if (editingId) {
      updatePost(editingId, { title, date, excerpt });
    } else {
      createPost({ title, date, excerpt });
    }
    resetEditor();
  });
  cancel.addEventListener('click', resetEditor);
}

function renderPlaylist() {
  const ul = el('#playlist-list');
  ul.innerHTML = '';
  playlist.forEach(track => {
    const li = document.createElement('li');
    li.className = 'playlist-item';
    li.dataset.src = track.src;
    li.dataset.id = track.id;
    li.innerHTML = `<div><strong>${track.title}</strong> — <span class="muted">${track.artist}</span></div><div class="controls-small">Play</div>`;
    li.addEventListener('click', () => playTrack(track));
    ul.appendChild(li);
  });
}

function renderVinylShelf() {
  const shelf = el('#vinyl-shelf');
  if (!shelf) return;
  shelf.innerHTML = '';
  vinyls.forEach(track => {
    const d = document.createElement('div');
    d.className = 'vinyl';
    d.dataset.id = track.id;
    d.dataset.src = track.src;
    // SVG circular text for wrap-around label + central readable label
    const pathId = `vinyl-path-${track.id}`;
    d.innerHTML = `
      <svg class="vinyl-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <path id="${pathId}" d="M60,60 m -36,0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"></path>
        </defs>
        <g transform="rotate(-12 60 60)">
          <text class="around-text" dy="-6">
            <textPath href="#${pathId}" startOffset="50%" text-anchor="middle">${escapeHtml(track.title + ' • ' + track.artist + ' • ')}</textPath>
          </text>
        </g>
      </svg>
      <div class="label center">${escapeHtml(track.title)}<small>${escapeHtml(track.artist)}</small></div>
    `;

    // Hover preview: use a short preview audio element
    d.addEventListener('mouseenter', () => startPreview(track, d));
    d.addEventListener('mouseleave', () => stopPreview(track, d));

    // Click plays full track (or toggles pause/play). Use a handler so we can start spinning immediately.
    d.addEventListener('click', () => vinylClickHandler(track, d));

    shelf.appendChild(d);
  });
}

// Basic HTML escaper for labels
function escapeHtml(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Preview audio element (separate from main player)
const previewAudio = new Audio();
previewAudio.preload = 'none';
let previewTimer = null;

function startPreview(track, elNode) {
  // set small volume and play short preview
  if (!track.preview) return;
  // visually mark
  elNode.classList.add('previewing');
  previewAudio.src = track.preview;
  previewAudio.volume = 0.22;
  // play a short snippet: start at 5s to avoid intros if desired
  previewAudio.currentTime = 5;
  previewAudio.play().catch(() => {});
  // stop after 6 seconds
  clearTimeout(previewTimer);
  previewTimer = setTimeout(() => {
    try { previewAudio.pause(); previewAudio.currentTime = 0; } catch (e) {}
  }, 6000);
}

function stopPreview(track, elNode) {
  elNode.classList.remove('previewing');
  clearTimeout(previewTimer);
  try { previewAudio.pause(); previewAudio.currentTime = 0; } catch (e) {}
}

let currentTrackId = null;
const audio = el('#audio');
const audioSource = el('#audio-source');
const trackInfo = el('#track-info');

function playTrack(track) {
  if (!track || !track.src) return;
  audioSource.src = track.src;
  audio.load();
  audio.play().catch(e => console.warn('Playback blocked', e));
  currentTrackId = track.id;
  updatePlayingUI();
  trackInfo.textContent = `${track.title} — ${track.artist}`;
}

// Handle vinyl clicks: start spin immediately and either play via audio player (if playable)
// or open external links (Spotify) in a new tab while showing a brief spin animation.
function vinylClickHandler(track, elNode){
  if(!track) return;
  // visual: add playing class immediately for feedback
  elNode.classList.add('playing');
  // if the track.src looks like an audio file (ends with common audio ext) use playTrack
  const isAudioFile = /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(track.src);
  if(isAudioFile){
    playTrack(track);
    return;
  }
  // If it's an external link (Spotify, etc), open in new tab and show a short spin
  try{
    window.open(track.src, '_blank', 'noopener');
  }catch(e){
    // fallback: navigate
    window.location.href = track.src;
  }
  // keep spin for 2s as feedback, then remove (but do not change currentTrackId)
  setTimeout(()=>{
    // only remove if not actually playing
    if(currentTrackId !== track.id){
      elNode.classList.remove('playing');
    }
  }, 2000);
}

function updatePlayingUI() {
  document.querySelectorAll('.playlist-item').forEach(li => {
    li.classList.toggle('playing', li.dataset.id === currentTrackId);
  });
  // mark vinyls as playing too
  document.querySelectorAll('.vinyl').forEach(v => {
    v.classList.toggle('playing', v.dataset.id === currentTrackId);
  });
}

function init() {
  // render
  const startingPosts = loadPosts();
  renderPosts(startingPosts);
  renderPlaylist();
  renderVinylShelf();
  initEditor();
  // search
  const search = el('#search');
  if (search) {
    search.addEventListener('input', e => {
      const q = e.target.value.trim().toLowerCase();
      const filtered = posts.filter(p => (p.title + ' ' + p.excerpt).toLowerCase().includes(q));
      renderPosts(filtered);
    });
  }
  // set year
  const yearEl = el('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  // when track ends
  audio.addEventListener('ended', () => {
    // play next
    const idx = playlist.findIndex(t => t.id === currentTrackId);
    const next = playlist[idx + 1];
    if (next) playTrack(next);
  });
  // sync vinyl spinning when audio plays/pauses
  audio.addEventListener('play', () => {
    document.querySelectorAll('.vinyl').forEach(v => v.classList.toggle('playing', v.dataset.id === currentTrackId));
  });
  audio.addEventListener('pause', () => {
    // stop spinning but keep the UI selected
    document.querySelectorAll('.vinyl').forEach(v => v.classList.remove('playing'));
  });
}

window.addEventListener('DOMContentLoaded', init);
