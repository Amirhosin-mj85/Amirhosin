# Amirhm — Lightweight Personal Content Site

A simple, offline-first personal content / blogging system built with **only HTML, CSS, and vanilla JavaScript**.  
No frameworks, no build tools, no backend, no external libraries.

Think of it as a tiny WordPress alternative that runs entirely in the browser (perfect for demos, GitHub Pages, or local use).

## Theme

Dark hacker / cyberpunk style:
- Black background
- Neon green accents
- Terminal / monospace fonts
- Subtle grid overlay

## Features

- **Public homepage** — list of posts (title + short excerpt) with “Read more”
- **Free registration & login** — users stored in `localStorage`
- **User dashboard** — logged-in users can create, edit, and delete their own posts
- **Admin panel** — only accessible with:
  - Username: `admin`
  - Password: `admin123`
  - Manage **all** posts and users
- **Pro ChatGPT page** — fake chat UI that echoes or returns random canned answers (no real API)
- Basic input sanitization + XSS protection (`escapeHtml` / `textContent`)
- Password “hashing” simulation with `btoa` (demo only — **not** real security)
- Fully responsive
- Works completely offline

## File Structure

```
amirhm-site/
├── index.html        # Public homepage + posts
├── login.html
├── register.html
├── dashboard.html    # User panel (create/edit/delete own posts)
├── admin.html        # Admin only
├── chatgpt.html      # Fake Pro ChatGPT
├── style.css
├── app.js            # All application logic
└── README.md
```

## How to Run

### Option 1 — Local (recommended for testing)

1. Download / clone this folder.
2. Open `index.html` directly in any modern browser  
   **or** serve the folder with any static server, e.g.:

```bash
# Python
python -m http.server 8000

# Node (if you have npx)
npx serve .
```

3. Visit `http://localhost:8000`

### Option 2 — GitHub Pages

1. Create a new repository.
2. Upload all files to the root (or `/docs` folder).
3. Go to **Settings → Pages** and enable GitHub Pages from the main branch.
4. Your site will be live at `https://<username>.github.io/<repo>/`

No build step required.

## Demo Accounts

| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | `admin`  | `admin123`|

Anyone can register a normal user account from the Register page.

## Data Storage

Everything lives in the browser’s `localStorage`:

- `amirhm_users` — registered users
- `amirhm_posts` — all posts
- `amirhm_session` — current login session

Clearing browser data / using a different browser / private window = empty site again.  
This is intentional for a pure client-side demo.

## Security Notes (Important)

This is a **demo / educational** project.

- Passwords are only “hashed” with `btoa` + a fixed salt — trivial to reverse.
- Admin credentials are hardcoded for convenience.
- All data is visible and editable in DevTools → Application → Local Storage.
- Never use this pattern for real production apps that handle sensitive data.

XSS protection is present (escaping + `textContent`), but treat the whole thing as insecure by design.

## License

Public domain / free to use and modify for any purpose.

---

Built for **Amirhm** · Keep it simple.
