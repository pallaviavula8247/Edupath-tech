# EDUPath

A simple, no-login education-pathway tool. A student (or a parent, or anyone
helping one) picks a goal — Engineering, Medicine, Data Science, and so on —
and their current standard (Class 8 through postgraduate), and gets back:

- a step-by-step **roadmap** to that goal from where they are
- **scholarships** they're eligible for at that stage
- **recommended colleges** for that field
- **nearby colleges**, using the browser's own location (optional, no account needed)

No authentication, no user accounts, no Docker — just a static frontend
talking to a small REST API.

## Stack

- **Frontend:** plain HTML, CSS, JavaScript (`/frontend`) — deploys to **Vercel**
- **Backend:** Django + Django REST Framework (`/backend`) — deploys to **Render**
- **Database:** SQLite locally, Postgres (Render-managed) in production

## Project structure

```
edupath-tech/
├── backend/
│   ├── core/                  # the one Django app: models, API views, seed data
│   │   ├── models.py          # Goal, RoadmapStep, Scholarship, College
│   │   ├── views.py           # /api/goals, /api/standards, /api/recommend
│   │   └── management/commands/seed_data.py
│   ├── edupath/                # Django project settings/urls
│   ├── requirements.txt
│   ├── build.sh                # Render build step (install, migrate, seed)
│   └── render.yaml             # optional one-click Render blueprint
└── frontend/
    ├── index.html
    ├── css/style.css
    ├── js/config.js            # <-- set your backend URL here
    └── js/app.js
```

## Run it locally

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # defaults are fine for local dev

python manage.py migrate
python manage.py seed_data      # loads goals, roadmaps, scholarships, colleges
python manage.py runserver 8000
```

The API is now at `http://127.0.0.1:8000/api/`. Try it:
`http://127.0.0.1:8000/api/goals/`

### 2. Frontend

The frontend is static — any local file server works. From the `frontend`
folder:

```bash
cd frontend
python3 -m http.server 5500
```

Open `http://127.0.0.1:5500`. It already points at
`http://127.0.0.1:8000` in `js/config.js`, and the backend's CORS settings
already allow `http://127.0.0.1:5500` by default — so it should work
immediately.

(If you use VS Code's "Live Server" instead, it typically serves on port
`5500` or `5501`, both already allowed. Using a different port? Add it to
`CORS_ALLOWED_ORIGINS` in `backend/.env`.)

### 3. Admin (optional)

To edit goals/roadmap/scholarships/colleges by hand instead of the seed
script:

```bash
python manage.py createsuperuser
```

Then visit `http://127.0.0.1:8000/admin/`.

---

## Deploying

### Push the code to GitHub first

```bash
cd edupath-tech
git init
git add .
git commit -m "EDUPath: initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/edupath-tech.git
git push -u origin main
```

(Create the empty `edupath-tech` repository on GitHub first, without a
README, then run the commands above.)

### Backend → Render

1. Go to [render.com](https://render.com) → **New** → **Blueprint**, and
   point it at your GitHub repo. Render will read `backend/render.yaml`
   automatically and set up both the web service and a free Postgres
   database.
   - No blueprint support / prefer manual setup? **New → Web Service**,
     pick the repo, set **Root Directory** to `backend`, **Build Command**
     to `./build.sh`, **Start Command** to `gunicorn edupath.wsgi:application`.
2. Add a free **PostgreSQL** instance (New → PostgreSQL) if you didn't use
   the blueprint, and copy its **Internal Database URL** into the web
   service's `DATABASE_URL` environment variable.
3. Set environment variables on the service:
   - `SECRET_KEY` — any long random string (Render can generate one)
   - `DEBUG` → `False`
   - `ALLOWED_HOSTS` → `.onrender.com`
   - `CORS_ALLOWED_ORIGINS` → your Vercel URL, added after step below,
     e.g. `https://edupath-tech.vercel.app`
4. Deploy. `build.sh` installs dependencies, runs migrations, and seeds the
   database automatically on every deploy. Note your live API URL, e.g.
   `https://edupath-backend.onrender.com`.

*(Render's free tier spins down after inactivity — the first request after
a quiet period can take 30-60 seconds to wake up. That's expected.)*

### Frontend → Vercel

1. Edit `frontend/js/config.js` and set:
   ```js
   const EDUPATH_API_BASE = "https://edupath-backend.onrender.com";
   ```
   (use your actual Render URL from the step above), then commit and push.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   the same GitHub repo.
3. Set **Root Directory** to `frontend`. Framework preset: **Other**
   (it's static HTML — no build command needed).
4. Deploy. Vercel gives you a URL like `https://edupath-tech.vercel.app`.
5. Go back to Render and update `CORS_ALLOWED_ORIGINS` to that exact
   Vercel URL, then redeploy the backend so it accepts requests from your
   live frontend. (Render also already trusts any `*.vercel.app` preview
   URL by default, via `CORS_ALLOWED_ORIGIN_REGEXES` in settings.py, so
   preview deployments work out of the box too.)

That's it — no Docker, no auth, two free-tier services talking to each
other.

## Extending the data

All content (goals, roadmap steps, scholarships, colleges) lives in
`backend/core/management/commands/seed_data.py` as plain Python lists —
edit it and re-run `python manage.py seed_data` (it's safe to re-run; it
replaces existing rows) or use the Django admin at `/admin/` once you've
created a superuser.
