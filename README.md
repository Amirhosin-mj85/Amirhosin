# Amirhm — Offline Cyberpunk Personal CMS

A lightweight WordPress-style personal content site made with only HTML, CSS and vanilla JavaScript.

## Files
- `index.html` — public posts
- `login.html` / `register.html` — demo authentication
- `dashboard.html` — create/edit/delete your own posts
- `admin.html` — admin management
- `chatgpt.html` — fake offline Pro ChatGPT UI
- `style.css` — cyberpunk theme
- `app.js` — all application logic

## Run
No server, package manager, framework or build step is required. Open `index.html` directly, or enable GitHub Pages for the repository.

## Demo admin
- Username: `admin`
- Password: `admin123`

## Important security note
This is a frontend-only demo. `localStorage`, hardcoded credentials, and `btoa()` are **not secure authentication or password hashing**. The sanitization in `app.js` is intended as basic XSS protection for this demo, not production security. For a real site, use a server-side backend, HTTPS, secure password hashing (Argon2/bcrypt/scrypt), sessions, authorization checks and a database.
