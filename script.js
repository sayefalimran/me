const supabase = window.supabaseClient;

const feed = document.getElementById('feed');
const statusEl = document.getElementById('status');
const adminSection = document.getElementById('updates-admin');
const adminLogin = document.getElementById('admin-login');
const adminConsole = document.getElementById('admin-console');
const loginForm = document.getElementById('login-form');
const publishButton = document.getElementById('publish-btn');
const logoutBtn = document.getElementById('logout-btn');

const OWNER_NAME = 'Your Name';

function showStatus(msg) {
  if (!statusEl) return;
  if (!msg) { statusEl.hidden = true; return; }
  statusEl.textContent = msg;
  statusEl.hidden = false;
}

function renderPosts(posts) {
  if (!feed) return;
  feed.innerHTML = posts.map(p => `
    <article class="post">
      <header>
        <strong>${p.author || OWNER_NAME}</strong>
        <time datetime="${p.created_at}">${new Date(p.created_at).toLocaleString()}</time>
      </header>
      <p>${(p.text || '').replace(/\n/g, '<br>')}</p>
      ${Array.isArray(p.images) && p.images.length ? `
        <div class="post-images">
          ${p.images.map(img => `<img src="${img.src}" alt="${img.alt ?? ''}">`).join('')}
        </div>` : ''
      }
    </article>
  `).join('');
}

async function loadPosts() {
  showStatus('Loading updates…');
  const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
  if (error) { console.error(error); showStatus('Unable to load updates.'); feed.innerHTML = ''; return; }
  renderPosts(data || []);
  showStatus((data && data.length) ? '' : 'No updates yet — check back soon.');
}

supabase.auth.onAuthStateChange((_e, session) => {
  const isAdmin = !!session;
  adminSection.hidden = false;
  adminLogin.hidden = isAdmin;
  adminConsole.hidden = !isAdmin;
});

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(`Sign in failed: ${error.message}`); else loginForm.reset();
  });
}

function buildPostFromForm() {
  const text = document.querySelector('#admin-console textarea')?.value?.trim();
  const imgs = (document.querySelector('#admin-console input[name="images"]')?.value || '')
    .split(',').map(s => s.trim()).filter(Boolean).map(src => ({ src, alt: '' }));
  if (!text) { alert('Please write something first.'); return null; }
  return { text, images: imgs };
}

if (publishButton) {
  publishButton.addEventListener('click', async () => {
    const post = buildPostFromForm();
    if (!post) return;
    const { error } = await supabase.from('posts').insert({
      author: OWNER_NAME,
      text: post.text,
      images: post.images
    });
    if (error) { alert(`Could not publish: ${error.message}`); return; }
    alert('Published!');
    document.querySelector('#admin-console textarea').value = '';
    document.querySelector('#admin-console input[name="images"]').value = '';
    loadPosts();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert(`Sign out failed: ${error.message}`);
  });
}

loadPosts();
