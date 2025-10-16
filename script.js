const ADMIN_TOKEN = 'letmein';
const ADMIN_STORAGE_KEY = 'portfolioUpdatesAdmin';
const OWNER_NAME = 'Md Sayef Al Imran';
const POSTS_FILE = 'posts.json';

document.addEventListener('DOMContentLoaded', () => {
    initSmoothScroll();
    initContactForm();
    initUpdatesPage();
});

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', event => {
            const targetId = anchor.getAttribute('href');
            if (!targetId || targetId === '#') {
                return;
            }

            const target = document.querySelector(targetId);
            if (target) {
                event.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

function initContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) {
        return;
    }

    contactForm.addEventListener('submit', event => {
        event.preventDefault();
        alert('Thank you for your message! I will get back to you soon.');
        contactForm.reset();
    });
}

function initUpdatesPage() {
    const feed = document.getElementById('updates-feed');
    if (!feed) {
        return;
    }

    const statusEl = document.getElementById('updates-status');
    const adminSection = document.getElementById('updates-admin');
    const form = document.getElementById('admin-post-form');
    const imageList = adminSection ? adminSection.querySelector('[data-role="image-list"]') : null;
    const previewWrapper = document.getElementById('admin-preview');
    const previewTarget = document.getElementById('admin-preview-target');

    let posts = [];

    // Updates renderer loads posts.json and prints cards in a Twitter-style layout.
    toggleStatus('Loading updates…', false);
    fetch(POSTS_FILE)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ${POSTS_FILE}`);
            }
            return response.json();
        })
        .then(data => {
            posts = Array.isArray(data) ? data.slice() : [];
            renderPosts(feed, posts);
            if (!posts.length) {
                toggleStatus('No updates yet — check back soon.', false);
            } else {
                toggleStatus('', true);
            }
        })
        .catch(error => {
            console.error(error);
            renderPosts(feed, []);
            toggleStatus('Unable to load updates right now. Please retry later.', false);
        });

    if (adminSection && form && imageList) {
        setupAdminConsole({ adminSection, form, imageList, previewWrapper, previewTarget, getPosts: () => posts });
    }

    function toggleStatus(message, hidden) {
        if (!statusEl) {
            return;
        }
        if (hidden) {
            statusEl.hidden = true;
            statusEl.textContent = '';
        } else {
            statusEl.hidden = false;
            statusEl.textContent = message;
        }
    }
}

function renderPosts(container, posts) {
    container.innerHTML = '';
    if (!posts.length) {
        return;
    }

    const sortedPosts = posts.slice().sort((a, b) => {
        const aTime = new Date(a.timestamp).getTime();
        const bTime = new Date(b.timestamp).getTime();
        return bTime - aTime;
    });

    const fragment = document.createDocumentFragment();
    sortedPosts.forEach(post => {
        fragment.appendChild(createPostElement(post));
    });
    container.appendChild(fragment);
}

function createPostElement(post) {
    const article = document.createElement('article');
    article.className = 'update-card';
    if (post.id) {
        article.id = post.id;
    }

    const timestampLabel = formatTimestamp(post.timestamp);
    article.setAttribute('aria-label', `${post.author} posted on ${timestampLabel}`);

    const meta = document.createElement('div');
    meta.className = 'update-card__meta';

    const authorEl = document.createElement('span');
    authorEl.className = 'update-card__author';
    authorEl.textContent = post.author;

    const timeEl = document.createElement('time');
    timeEl.className = 'update-card__time';
    timeEl.dateTime = post.timestamp;
    timeEl.textContent = timestampLabel;

    meta.appendChild(authorEl);
    meta.appendChild(timeEl);
    article.appendChild(meta);

    if (post.text) {
        const textEl = document.createElement('p');
        textEl.className = 'update-card__text';
        textEl.innerHTML = formatPostText(post.text);
        article.appendChild(textEl);
    }

    const images = Array.isArray(post.images) ? post.images.filter(img => img && img.src) : [];
    if (images.length) {
        const media = document.createElement('div');
        const count = Math.min(images.length, 4);
        media.className = `update-card__media update-card__media--count-${count}`;

        images.slice(0, 4).forEach((image, index) => {
            const figure = document.createElement('figure');

            const img = document.createElement('img');
            img.src = image.src;
            img.alt = image.alt || `Update image ${index + 1}`;
            img.loading = 'lazy';
            img.decoding = 'async';

            figure.appendChild(img);

            if (image.caption) {
                const caption = document.createElement('figcaption');
                caption.textContent = image.caption;
                figure.appendChild(caption);
            }

            media.appendChild(figure);
        });

        article.appendChild(media);
    }

    const actions = document.createElement('div');
    actions.className = 'update-card__actions';

    ['Like', 'Reply', 'Share'].forEach(label => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.setAttribute('aria-label', `${label} (coming soon)`);
        actions.appendChild(button);
    });

    article.appendChild(actions);
    return article;
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return timestamp;
    }

    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(date);
}

function formatPostText(text) {
    const escaped = escapeHTML(text);
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const withLinks = escaped.replace(urlPattern, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
    return withLinks.replace(/\n/g, '<br>');
}

function escapeHTML(value) {
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
}

function setupAdminConsole({ adminSection, form, imageList, previewWrapper, previewTarget, getPosts }) {
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');

    /*
     * Owner console helpers:
     * - Update ADMIN_TOKEN above to change the ?admin= passphrase.
     * - After downloading posts.json, replace that file on your host/repo to publish the new post.
     * - For production-ready auth, plug this page into a proper CMS or server workflow.
     */
    if (adminParam === ADMIN_TOKEN) {
        localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
        urlParams.delete('admin');
        const newQuery = urlParams.toString();
        const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', newUrl);
    }

    const isAdmin = localStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
    if (!isAdmin) {
        return;
    }

    adminSection.hidden = false;
    let fieldCount = 0;

    addImageRow();

    const addButton = document.getElementById('add-image-field');
    if (addButton) {
        addButton.addEventListener('click', () => addImageRow());
    }

    const previewButton = document.getElementById('preview-post');
    if (previewButton) {
        previewButton.addEventListener('click', () => {
            const post = buildPostFromForm();
            if (!post) {
                return;
            }
            if (previewTarget) {
                previewTarget.innerHTML = '';
                previewTarget.appendChild(createPostElement(post));
            }
            if (previewWrapper) {
                previewWrapper.hidden = false;
            }
        });
    }

    const downloadButton = document.getElementById('download-json');
    if (downloadButton) {
        downloadButton.addEventListener('click', () => {
            const post = buildPostFromForm();
            if (!post) {
                return;
            }
            const nextPosts = [post, ...getPosts()];
            const blob = new Blob([JSON.stringify(nextPosts, null, 2)], { type: 'application/json' });
            const filename = `posts-${new Date().toISOString().split('T')[0]}.json`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            alert('Download complete. Replace posts.json with the file you just downloaded to publish the update.');
        });
    }

    function buildPostFromForm() {
        const consoleEl = document.getElementById('admin-console');
        const textarea = consoleEl ? consoleEl.querySelector('textarea') : document.querySelector('textarea');
        const text = textarea ? textarea.value.trim() : '';
        if (!text) {
            return null;
        }

        const imagesInput = consoleEl
            ? consoleEl.querySelector('input[name="images"]')
            : document.querySelector('input[name="images"]');
        const raw = imagesInput ? imagesInput.value : '';
        const images = raw
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .map(src => ({ src, alt: '' }));

        return { text, images };
    }

    function addImageRow(url = '', alt = '') {
        fieldCount += 1;
        const row = document.createElement('div');
        row.className = 'admin-image-row';
        row.setAttribute('data-image-row', 'true');

        const urlId = `admin-image-url-${fieldCount}`;
        const altId = `admin-image-alt-${fieldCount}`;

        const urlWrapper = document.createElement('div');
        const urlLabel = document.createElement('label');
        urlLabel.setAttribute('for', urlId);
        urlLabel.textContent = 'Image URL';
        const urlInput = document.createElement('input');
        urlInput.type = 'url';
        urlInput.id = urlId;
        urlInput.placeholder = 'https://...';
        urlInput.value = url;
        urlInput.setAttribute('data-image-url', 'true');
        urlWrapper.appendChild(urlLabel);
        urlWrapper.appendChild(urlInput);

        const altWrapper = document.createElement('div');
        const altLabel = document.createElement('label');
        altLabel.setAttribute('for', altId);
        altLabel.textContent = 'Alt text';
        const altInput = document.createElement('input');
        altInput.type = 'text';
        altInput.id = altId;
        altInput.placeholder = 'Describe the image';
        altInput.value = alt;
        altInput.setAttribute('data-image-alt', 'true');
        altWrapper.appendChild(altLabel);
        altWrapper.appendChild(altInput);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = 'Remove';
        removeButton.setAttribute('data-remove-image', 'true');
        removeButton.addEventListener('click', () => {
            row.remove();
            refreshRemoveButtons();
        });

        row.appendChild(urlWrapper);
        row.appendChild(altWrapper);
        row.appendChild(removeButton);
        imageList.appendChild(row);
        refreshRemoveButtons();
    }

    function refreshRemoveButtons() {
        const rows = imageList.querySelectorAll('[data-image-row]');
        rows.forEach(row => {
            const removeButton = row.querySelector('[data-remove-image]');
            if (!removeButton) {
                return;
            }
            const hideButton = rows.length === 1;
            removeButton.disabled = hideButton;
            removeButton.style.display = hideButton ? 'none' : 'inline-flex';
        });
    }
}

(function () {
    if (!window.supabaseClient) {
        console.warn('Supabase client not found on window.supabaseClient — skipping Supabase integration.');
        return;
    }
    const supabase = window.supabaseClient;
    const statusEl = document.getElementById('status');
    const feedEl = document.getElementById('feed');
    const loginForm = document.getElementById('login-form');
    const adminConsole = document.getElementById('admin-console');
    const publishBtn = document.getElementById('publish-btn');
    const logoutBtn = document.getElementById('logout-btn');

    async function setStatus(message, hideWhenEmpty = true) {
        if (!statusEl) return;
        if (!message && hideWhenEmpty) {
            statusEl.hidden = true;
            statusEl.textContent = '';
        } else {
            statusEl.hidden = false;
            statusEl.textContent = message || '';
        }
    }

    async function fetchAndRenderPosts() {
        if (!feedEl) return;
        setStatus('Loading updates…', false);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }
            renderPosts(feedEl, data);
            setStatus('');
        } catch (err) {
            console.error(err);
            renderPosts(feedEl, []);
            setStatus('Unable to load updates right now. Please retry later.');
        }
    }

    // login handler
    if (loginForm) {
        loginForm.addEventListener('submit', async (ev) => {
            ev.preventDefault();
            const emailInput = loginForm.querySelector('input[name="email"]');
            const passInput = loginForm.querySelector('input[name="password"]');
            const email = emailInput ? emailInput.value.trim() : '';
            const password = passInput ? passInput.value : '';
            if (!email || !password) {
                alert('Please provide email and password.');
                return;
            }
            try {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    alert(error.message || 'Sign-in failed');
                    return;
                }
                // success: reset form and refresh posts
                loginForm.reset();
                alert('Signed in');
                await fetchAndRenderPosts();
            } catch (err) {
                alert(err?.message || 'Sign-in failed');
            }
        });
    }

    if (adminConsole) {
        adminConsole.hidden = true;
    }

    // Supabase auth state listener: log event/session and toggle admin UI
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('auth state change:', event, session);

        // Ensure the admin wrapper is visible in the DOM
        const updatesAdminEl = document.getElementById('updates-admin');
        if (updatesAdminEl) updatesAdminEl.hidden = false;

        // Hide the admin login UI when session exists.
        // The page currently uses id="login-form", but some code references #admin-login —
        // check both and apply the same behavior.
        const adminLoginEl = document.getElementById('admin-login') || document.getElementById('login-form');
        if (adminLoginEl) adminLoginEl.hidden = !!session;

        // Show the admin console only when a session exists
        const adminConsoleEl = document.getElementById('admin-console');
        if (adminConsoleEl) adminConsoleEl.hidden = !session;
    });

    // publish handler: build post, insert into Supabase, clear form, reload posts
    if (publishBtn) {
        publishBtn.addEventListener('click', async () => {
            const post = (typeof buildPostFromForm === 'function') ? buildPostFromForm() : null;
            if (!post) {
                alert('Please add some text before publishing.');
                return;
            }

            if (!supabase) {
                alert('Supabase client not available.');
                return;
            }

            try {
                const { error } = await supabase.from('posts').insert([{
                    author: 'Sayef Imran',
                    text: post.text,
                    images: post.images
                }]);

                if (error) {
                    alert(error.message || 'Publish failed');
                    return;
                }

                // clear form fields inside admin console
                const consoleEl = document.getElementById('admin-console');
                if (consoleEl) {
                    const ta = consoleEl.querySelector('textarea');
                    if (ta) ta.value = '';
                    const imgs = consoleEl.querySelector('input[name="images"]');
                    if (imgs) imgs.value = '';
                }

                alert('Published successfully.');
                // reload posts
                if (typeof fetchAndRenderPosts === 'function') {
                    await fetchAndRenderPosts();
                }
            } catch (err) {
                console.error(err);
                alert(err?.message || 'Publish failed');
            }
        });
    } else {
        console.log('publish-btn not found');
    }

    // logout handler: sign out via Supabase, alert on error, log success
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (!supabase) {
                alert('Supabase client not available.');
                return;
            }
            try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    alert(error.message || 'Sign-out failed');
                    return;
                }
                console.log('signed out');
            } catch (err) {
                alert(err?.message || 'Sign-out failed');
            }
        });
    } else {
        console.log('logout-btn not found');
    }

    fetchAndRenderPosts();
})();
