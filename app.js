/**
 * Amirhm - Lightweight content engine
 * All logic in one file. localStorage only. Offline-ready.
 */

// ---------- Helpers ----------
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

function hashPassword(pw) {
  // Simple demo "hash" using btoa (NOT real security)
  return btoa(unescape(encodeURIComponent(pw + '_amirhm_salt')));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('amirhm_users') || '[]');
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem('amirhm_users', JSON.stringify(users));
}

function getPosts() {
  try {
    return JSON.parse(localStorage.getItem('amirhm_posts') || '[]');
  } catch {
    return [];
  }
}

function savePosts(posts) {
  localStorage.setItem('amirhm_posts', JSON.stringify(posts));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('amirhm_session') || 'null');
  } catch {
    return null;
  }
}

function setSession(user) {
  if (user) {
    localStorage.setItem('amirhm_session', JSON.stringify({
      username: user.username,
      isAdmin: !!user.isAdmin
    }));
  } else {
    localStorage.removeItem('amirhm_session');
  }
}

function isLoggedIn() {
  return !!getCurrentUser();
}

function isAdmin() {
  const u = getCurrentUser();
  return u && u.isAdmin === true;
}

function requireAuth(redirect = 'login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirect;
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!isAdmin()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function logout() {
  setSession(null);
  window.location.href = 'index.html';
}

function showMsg(elId, text, type = 'error') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.className = 'msg msg-' + type;
  el.textContent = text;
  el.classList.remove('hidden');
}

function hideMsg(elId) {
  const el = document.getElementById(elId);
  if (el) el.classList.add('hidden');
}

// Seed admin user on first load
function ensureAdmin() {
  const users = getUsers();
  if (!users.find(u => u.username === 'admin')) {
    users.push({
      username: 'admin',
      password: hashPassword('admin123'),
      isAdmin: true,
      createdAt: new Date().toISOString()
    });
    saveUsers(users);
  }
}
ensureAdmin();

// ---------- Auth ----------
function register(username, password) {
  username = (username || '').trim().toLowerCase();
  if (!username || username.length < 3) return { ok: false, msg: 'Username must be at least 3 characters.' };
  if (!password || password.length < 4) return { ok: false, msg: 'Password must be at least 4 characters.' };
  if (!/^[a-z0-9_]+$/.test(username)) return { ok: false, msg: 'Username: letters, numbers, underscore only.' };
  if (username === 'admin') return { ok: false, msg: 'Username reserved.' };

  const users = getUsers();
  if (users.find(u => u.username === username)) {
    return { ok: false, msg: 'Username already taken.' };
  }

  users.push({
    username,
    password: hashPassword(password),
    isAdmin: false,
    createdAt: new Date().toISOString()
  });
  saveUsers(users);
  return { ok: true, msg: 'Registered successfully. You can log in now.' };
}

function login(username, password) {
  username = (username || '').trim().toLowerCase();
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user || user.password !== hashPassword(password)) {
    return { ok: false, msg: 'Invalid username or password.' };
  }
  setSession(user);
  return { ok: true, user };
}

// ---------- Posts ----------
function createPost(title, content) {
  const user = getCurrentUser();
  if (!user) return { ok: false, msg: 'Not logged in.' };
  title = (title || '').trim();
  content = (content || '').trim();
  if (!title || title.length < 2) return { ok: false, msg: 'Title too short.' };
  if (!content || content.length < 5) return { ok: false, msg: 'Content too short.' };

  const posts = getPosts();
  const post = {
    id: generateId(),
    title,
    content,
    excerpt: content.slice(0, 140) + (content.length > 140 ? '…' : ''),
    author: user.username,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  posts.unshift(post);
  savePosts(posts);
  return { ok: true, post };
}

function updatePost(id, title, content) {
  const user = getCurrentUser();
  if (!user) return { ok: false, msg: 'Not logged in.' };
  const posts = getPosts();
  const idx = posts.findIndex(p => p.id === id);
  if (idx === -1) return { ok: false, msg: 'Post not found.' };
  const post = posts[idx];
  if (post.author !== user.username && !user.isAdmin) {
    return { ok: false, msg: 'Not allowed.' };
  }
  title = (title || '').trim();
  content = (content || '').trim();
  if (!title || !content) return { ok: false, msg: 'Title and content required.' };

  posts[idx] = {
    ...post,
    title,
    content,
    excerpt: content.slice(0, 140) + (content.length > 140 ? '…' : ''),
    updatedAt: new Date().toISOString()
  };
  savePosts(posts);
  return { ok: true };
}

function deletePost(id) {
  const user = getCurrentUser();
  if (!user) return { ok: false, msg: 'Not logged in.' };
  const posts = getPosts();
  const post = posts.find(p => p.id === id);
  if (!post) return { ok: false, msg: 'Post not found.' };
  if (post.author !== user.username && !user.isAdmin) {
    return { ok: false, msg: 'Not allowed.' };
  }
  savePosts(posts.filter(p => p.id !== id));
  return { ok: true };
}

function deleteUser(username) {
  if (!isAdmin()) return { ok: false, msg: 'Admin only.' };
  if (username === 'admin') return { ok: false, msg: 'Cannot delete admin.' };
  let users = getUsers().filter(u => u.username !== username);
  saveUsers(users);
  // Optionally remove their posts
  let posts = getPosts().filter(p => p.author !== username);
  savePosts(posts);
  return { ok: true };
}

// ---------- Render helpers ----------
function renderNavbar(activePage) {
  const user = getCurrentUser();
  const links = [
    { href: 'index.html', label: 'Home' },
    { href: 'chatgpt.html', label: 'Pro ChatGPT' }
  ];
  if (user) {
    links.push({ href: 'dashboard.html', label: 'Dashboard' });
    if (user.isAdmin) links.push({ href: 'admin.html', label: 'Admin' });
  } else {
    links.push({ href: 'login.html', label: 'Login' });
    links.push({ href: 'register.html', label: 'Register' });
  }

  let html = `<nav class="navbar">
    <a href="index.html" class="logo">AMIR<span>HM</span>_</a>
    <div class="nav-links">`;
  links.forEach(l => {
    const active = activePage === l.href ? ' style="text-shadow:0 0 8px var(--neon-glow)"' : '';
    html += `<a href="${l.href}"${active}>${l.label}</a>`;
  });
  if (user) {
    html += `<span style="color:#666;font-size:0.85rem">[${escapeHtml(user.username)}]</span>`;
    html += `<button type="button" onclick="logout()">Logout</button>`;
  }
  html += `</div></nav>`;
  return html;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

// ---------- Page-specific init ----------
function initIndex() {
  const list = document.getElementById('posts-list');
  if (!list) return;
  const posts = getPosts();
  if (posts.length === 0) {
    list.innerHTML = '<p class="text-center" style="color:#666">No posts yet. Be the first to write something.</p>';
    return;
  }
  list.innerHTML = posts.map(p => `
    <article class="post-card">
      <h2>${escapeHtml(p.title)}</h2>
      <div class="post-meta">by ${escapeHtml(p.author)} · ${formatDate(p.createdAt)}</div>
      <p class="post-excerpt">${escapeHtml(p.excerpt)}</p>
      <div class="post-actions">
        <button type="button" onclick="viewPost('${p.id}')">Read more</button>
      </div>
    </article>
  `).join('');
}

function viewPost(id) {
  const posts = getPosts();
  const p = posts.find(x => x.id === id);
  if (!p) return;
  const list = document.getElementById('posts-list');
  if (!list) return;
  list.innerHTML = `
    <article class="post-card">
      <h2>${escapeHtml(p.title)}</h2>
      <div class="post-meta">by ${escapeHtml(p.author)} · ${formatDate(p.createdAt)}</div>
      <div style="white-space:pre-wrap;margin-top:1rem">${escapeHtml(p.content)}</div>
      <div class="post-actions mt-1">
        <button type="button" onclick="initIndex()">← Back to list</button>
      </div>
    </article>
  `;
}

function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideMsg('msg');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = login(username, password);
    if (!res.ok) {
      showMsg('msg', res.msg, 'error');
      return;
    }
    if (res.user.isAdmin) {
      window.location.href = 'admin.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  });
}

function initRegister() {
  const form = document.getElementById('register-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideMsg('msg');
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const res = register(username, password);
    showMsg('msg', res.msg, res.ok ? 'success' : 'error');
    if (res.ok) {
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    }
  });
}

function initDashboard() {
  if (!requireAuth()) return;
  const user = getCurrentUser();
  document.getElementById('welcome').textContent = `Welcome, ${user.username}`;

  const form = document.getElementById('post-form');
  const editId = document.getElementById('edit-id');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    hideMsg('msg');
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const id = editId.value;
    let res;
    if (id) {
      res = updatePost(id, title, content);
    } else {
      res = createPost(title, content);
    }
    showMsg('msg', res.ok ? (id ? 'Post updated.' : 'Post created.') : res.msg, res.ok ? 'success' : 'error');
    if (res.ok) {
      form.reset();
      editId.value = '';
      document.getElementById('form-title').textContent = 'New Post';
      renderMyPosts();
    }
  });

  renderMyPosts();
}

function renderMyPosts() {
  const user = getCurrentUser();
  const container = document.getElementById('my-posts');
  if (!container) return;
  const posts = getPosts().filter(p => p.author === user.username);
  if (posts.length === 0) {
    container.innerHTML = '<p style="color:#666">You have no posts yet.</p>';
    return;
  }
  container.innerHTML = posts.map(p => `
    <article class="post-card">
      <h3>${escapeHtml(p.title)}</h3>
      <div class="post-meta">${formatDate(p.createdAt)}</div>
      <p class="post-excerpt">${escapeHtml(p.excerpt)}</p>
      <div class="post-actions">
        <button type="button" onclick="editMyPost('${p.id}')">Edit</button>
        <button type="button" class="btn-danger" onclick="deleteMyPost('${p.id}')">Delete</button>
      </div>
    </article>
  `).join('');
}

function editMyPost(id) {
  const posts = getPosts();
  const p = posts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('edit-id').value = p.id;
  document.getElementById('title').value = p.title;
  document.getElementById('content').value = p.content;
  document.getElementById('form-title').textContent = 'Edit Post';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteMyPost(id) {
  if (!confirm('Delete this post?')) return;
  const res = deletePost(id);
  if (res.ok) renderMyPosts();
  else alert(res.msg);
}

function initAdmin() {
  if (!requireAdmin()) return;
  renderAdminPosts();
  renderAdminUsers();
}

function renderAdminPosts() {
  const container = document.getElementById('admin-posts');
  if (!container) return;
  const posts = getPosts();
  if (posts.length === 0) {
    container.innerHTML = '<p style="color:#666">No posts.</p>';
    return;
  }
  container.innerHTML = `
    <table>
      <thead><tr><th>Title</th><th>Author</th><th>Date</th><th>Actions</th></tr></thead>
      <tbody>
        ${posts.map(p => `
          <tr>
            <td>${escapeHtml(p.title)}</td>
            <td>${escapeHtml(p.author)}</td>
            <td>${formatDate(p.createdAt)}</td>
            <td>
              <button type="button" class="btn-danger" onclick="adminDeletePost('${p.id}')">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function adminDeletePost(id) {
  if (!confirm('Delete this post permanently?')) return;
  deletePost(id);
  renderAdminPosts();
}

function renderAdminUsers() {
  const container = document.getElementById('admin-users');
  if (!container) return;
  const users = getUsers();
  container.innerHTML = `
    <table>
      <thead><tr><th>Username</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>${escapeHtml(u.username)}</td>
            <td>${u.isAdmin ? 'Admin' : 'User'}</td>
            <td>${formatDate(u.createdAt)}</td>
            <td>
              ${u.username !== 'admin'
                ? `<button type="button" class="btn-danger" onclick="adminDeleteUser('${escapeHtml(u.username)}')">Delete</button>`
                : '—'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function adminDeleteUser(username) {
  if (!confirm(`Delete user "${username}" and all their posts?`)) return;
  const res = deleteUser(username);
  if (res.ok) {
    renderAdminUsers();
    renderAdminPosts();
  } else {
    alert(res.msg);
  }
}

// ---------- Fake Pro ChatGPT ----------
const FAKE_REPLIES = [
  "Interesting question. In a parallel universe, the answer is 42.",
  "Processing... [SIMULATED] I would recommend starting with the basics.",
  "As a fake Pro model, I confidently say: yes, but also no.",
  "Have you tried turning it off and on again? Classic move.",
  "The matrix has you. But also, check your localStorage.",
  "I'm not a real AI, just a few if-statements pretending to be one.",
  "Cyberpunk tip: always sanitize your inputs. Especially the ones that look friendly.",
  "According to my training data (which is empty), the answer is neon green.",
  "Error 418: I'm a teapot. Just kidding — here's a random thought instead.",
  "In the year 2077, this conversation will be considered vintage."
];

function initChat() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');
  if (!form || !input || !messages) return;

  // Welcome message
  appendBot("Welcome to Pro ChatGPT (demo). I'm not connected to any real model — I just echo or invent answers. Type something.");

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    appendUser(text);
    input.value = '';
    // Fake delay
    setTimeout(() => {
      const reply = pickFakeReply(text);
      appendBot(reply);
    }, 400 + Math.random() * 600);
  });
}

function appendUser(text) {
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg user';
  div.textContent = text; // textContent = XSS safe
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function appendBot(text) {
  const messages = document.getElementById('chat-messages');
  const div = document.createElement('div');
  div.className = 'chat-msg bot';
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

function pickFakeReply(userText) {
  // Sometimes echo
  if (Math.random() < 0.3) {
    return `You said: "${userText.slice(0, 120)}${userText.length > 120 ? '…' : ''}" — noted.`;
  }
  return FAKE_REPLIES[Math.floor(Math.random() * FAKE_REPLIES.length)];
}

// Expose needed functions globally for onclick handlers
window.logout = logout;
window.viewPost = viewPost;
window.initIndex = initIndex;
window.editMyPost = editMyPost;
window.deleteMyPost = deleteMyPost;
window.adminDeletePost = adminDeletePost;
window.adminDeleteUser = adminDeleteUser;
