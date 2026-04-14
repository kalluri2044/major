# 🧠 NeuroScan AI

**Full-stack Alzheimer's early detection platform.**  
Flask API + React SPA — shipped as a **single project** that runs on one port.

---

## Architecture

```
neuroscan/                   ← project root
├── app.py                   ← Flask app (serves API + React build)
├── run.py                   ← convenience runner
├── config.py                ← configuration
├── requirements.txt         ← Python deps
├── setup.sh                 ← one-command install + build
├── .env.example             ← environment variable template
│
├── database/
│   ├── db.py                ← SQLAlchemy instance
│   └── models.py            ← 10 models
│
├── routes/                  ← 9 Flask blueprints (48+ endpoints)
│   ├── auth_routes.py
│   ├── user_routes.py
│   ├── admin_routes.py
│   ├── demographic_routes.py
│   ├── cognitive_routes.py
│   ├── mri_routes.py
│   ├── fusion_routes.py
│   ├── report_routes.py
│   └── phase6_routes.py
│
├── services/                ← business logic layer
│   ├── demographic_service.py
│   ├── cognitive_service.py
│   ├── mri_service.py
│   ├── fusion_service.py
│   ├── recommendation_service.py
│   ├── report_service.py
│   └── notification_service.py
│
├── utils/
│   ├── auth_utils.py        ← JWT helpers + role decorators
│   └── image_utils.py       ← MRI preprocessing pipeline
│
├── uploads/
│   ├── mri/                 ← uploaded MRI scans
│   └── reports/             ← generated PDF reports
│
├── ml/                      ← CNN training scripts (optional)
│   ├── training/
│   │   ├── build_vgg16.py
│   │   ├── build_resnet50.py
│   │   └── evaluate.py
│   └── TRAINING_GUIDE.md
│
└── client/                  ← React 18 SPA
    ├── package.json
    ├── public/index.html
    └── src/
        ├── App.jsx           ← 18 routes
        ├── index.js
        ├── context/AuthContext.jsx
        ├── services/api.js   ← typed API client (auto-switches dev/prod URL)
        ├── components/DesignSystem.js
        └── pages/            ← 22 pages + 5 admin pages
```

---

## Quick Start

### Option A — Single server (production-style)

```bash
# 1. Install everything + build React
bash setup.sh

# 2. Activate Python env
source venv/bin/activate       # macOS/Linux
# venv\Scripts\activate        # Windows

# 3. Run
python app.py
```

Open **http://localhost:5000** — Flask serves both the API and the React app.

---

### Option B — Hot-reload development

Run two terminals for React hot-reload while developing:

```bash
# Terminal 1 — Flask API (port 5000)
source venv/bin/activate
python app.py

# Terminal 2 — React dev server (port 3000, proxies /api to 5000)
cd client
npm start
```

Open **http://localhost:3000** — React hot-reloads, API calls proxy to Flask.

---

## How it works (single-server mode)

```
Browser → http://localhost:5000
              │
              ├── /api/*    → Flask handles (JWT-protected routes)
              │
              └── /*        → Flask serves client/build/index.html
                               React Router handles client-side navigation
```

The `"proxy": "http://localhost:5000"` in `client/package.json` makes the
React dev server forward all `/api` requests to Flask during development.

---

## First Run

1. Visit **http://localhost:5000/register** and create a patient account.
2. Go through the full assessment flow: Demographics → Cognitive → MRI → Results.
3. To create an admin account, use the seed command:

```bash
python -c "
from app import create_app
from database.db import db
from database.models import User
from utils.auth_utils import hash_password
app = create_app()
with app.app_context():
    u = User(name='Admin', email='admin@clinic.com',
             password_hash=hash_password('Admin@123'), role='admin')
    db.session.add(u); db.session.commit()
    print('Admin created: admin@clinic.com / Admin@123')
"
```

---

## API Reference

All endpoints are prefixed with `/api`.

### Auth — `/api/auth`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register new patient |
| POST | `/login` | Login → tokens |
| POST | `/refresh` | Refresh access token |
| GET  | `/me` | Current user |
| POST | `/change-password` | Change password |

### User — `/api/user`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Dashboard data |
| GET/PUT | `/profile` | Get/update profile |
| GET | `/sessions` | List sessions |
| POST | `/sessions` | Start/resume session |
| GET | `/sessions/:id` | Session detail |
| GET | `/progression` | Progression history |
| GET | `/reports` | Report list |

### Assessment — `/api/demographics`, `/api/cognitive`, `/api/mri`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/demographics/save` | Save demographics |
| GET  | `/demographics` | Get saved demographics |
| POST | `/demographics/risk-preview` | Live risk preview |
| GET  | `/cognitive/questions` | 25 MMSE+MoCA questions |
| POST | `/cognitive/submit` | Submit answers + score |
| POST | `/mri/upload` | Upload + analyse MRI |

### Fusion + Results — `/api/fusion`, `/api/results`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/fusion/compute/:session_id` | Run weighted fusion |
| GET  | `/fusion/result/:session_id` | Fusion result |
| GET  | `/results/:session_id` | Full assembled results |

### Reports — `/api/report`
| Method | Path | Description |
|--------|------|-------------|
| POST | `/generate/:session_id` | Generate PDF |
| GET  | `/download/:session_id` | Download PDF |
| GET  | `/list` | List reports |

### Notifications + Settings — `/api`
| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List with unread count |
| PUT | `/notifications/read-all` | Mark all read |
| PUT | `/settings/profile` | Update name/email |
| PUT | `/settings/password` | Change password |

### Admin — `/api/admin`
| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | `/analytics` | Admin+Doctor | 7 KPIs |
| GET | `/analytics/advanced` | Admin+Doctor | Breakdowns |
| GET | `/patients` | Admin+Doctor | Paginated list |
| GET | `/flagged` | Admin+Doctor | High-risk patients |
| GET | `/recent-activity` | Admin+Doctor | Last 20 sessions |
| GET/POST | `/doctors` | Admin | Staff management |
| GET/PUT | `/model-config` | Admin | Fusion weights |
| GET | `/export/patients` | Admin | CSV download |

---

## CNN Model Training (optional)

By default the app uses **mock predictions** so you can run it without TensorFlow.

To use real CNN inference:
1. Download the [Alzheimer's MRI dataset](https://www.kaggle.com/datasets/tourist55/alzheimers-dataset-4-class-of-images) from Kaggle
2. Place in `ml/data/train/` and `ml/data/test/`
3. Uncomment TensorFlow in `requirements.txt` and reinstall
4. Train:
```bash
python ml/training/build_vgg16.py      # saves models/vgg16_alzheimer.h5
python ml/training/build_resnet50.py   # saves models/resnet50_alzheimer.h5
```

---

## Fusion Formula

```
AD% = 0.20 × demographic_risk
    + 0.35 × (100 − cognitive_score)
    + 0.45 × mri_risk
```

Weights are configurable by admin at runtime via **Admin → Model Config**.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Python 3.10+, Flask 3.0, SQLAlchemy 2.0, Flask-JWT-Extended |
| Database | SQLite (dev) / PostgreSQL (prod) |
| PDF | ReportLab |
| Frontend | React 18, React Router 6, Axios |
| Fonts | DM Sans, Instrument Serif, DM Mono |
| ML (optional) | TensorFlow 2.16, VGG16, ResNet50 |

---

## Deployment

```bash
# Set production env vars
export FLASK_ENV=production
export JWT_SECRET_KEY=your-secure-random-string
export SECRET_KEY=your-secure-random-string
export DATABASE_URL=postgresql://user:pass@host/db

# Build React
cd client && npm run build && cd ..

# Run with gunicorn
pip install gunicorn
gunicorn "app:create_app()" --bind 0.0.0.0:8000 --workers 4
```

> ⚕️ **Clinical Disclaimer**: For research and decision-support only.  
> Not a replacement for physician diagnosis.
