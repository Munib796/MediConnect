# MediConnect

A full-stack hospital and doctor appointment booking platform built for the Pakistani market. MediConnect connects patients with doctors across multiple hospitals, with dedicated portals for patients, doctors, and administrators.

## Features

### Patient Portal
- Search doctors by city and specialization
- Browse hospitals and see doctors affiliated with each
- Book appointments (cash or online payment via Stripe)
- Token-based queue system — no guessing your place in line
- View appointment history and leave reviews for completed visits
- Email confirmations for bookings

### Doctor Portal
- Apply to hospitals with fee, schedule, and capacity details (document upload required)
- Track application status (pending / approved / rejected)
- Toggle availability at approved hospitals
- View and manage appointments
- Mark appointments complete (only once payment is received)
- Profile management with photo upload

### Admin Portal
- Manage cities, specializations, and hospitals (with image upload)
- Review and approve/reject doctor-hospital affiliation applications
- Oversee all appointments platform-wide (mark cash payments as paid, remove bookings)
- Dashboard with at-a-glance platform stats

All three portals are strictly role-separated — a user logged into one cannot access the other two until they log out.

## Tech Stack

**Backend:** FastAPI, SQLAlchemy, Alembic, PostgreSQL
**Frontend:** React 19, Vite, Tailwind CSS, React Router v7, Axios

**Integrations:** Stripe (online payments), Cloudinary (image uploads), fastapi-mail (transactional emails)

## Project Structure

├── backend/
│   ├── src/
│   │   ├── admin/
│   │   ├── appointments/
│   │   ├── cities/
│   │   ├── doctor_hospitals/
│   │   ├── doctors/
│   │   ├── hospitals/
│   │   ├── patients/
│   │   ├── reviews/
│   │   ├── specializations/
│   │   └── utils/
│   ├── main.py
│   ├── requirements.txt
│   └── docker-compose.yml
└── frontend/
└── src/
├── components/
├── context/
├── lib/
└── pages/
├── admin/
├── doctor/
├── patient/
└── public/
## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (for local PostgreSQL)

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

docker-compose up -d       # starts Postgres + Adminer

cp .env.example .env       # fill in your actual values
alembic upgrade head
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000` (interactive docs at `/docs`).

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env       # set VITE_API_BASE_URL to your backend URL
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Environment Variables

See `backend/.env.example` for the full list of required variables (database, JWT secret, admin credentials, Stripe keys, Cloudinary credentials, mail settings).

## Admin Access

The admin portal has no public link in the UI by design — log in directly at `/admin/login` using the credentials set in `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

## License

Private project — all rights reserved.
