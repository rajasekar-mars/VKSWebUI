# VKSWebUI

A full-stack web application with:
- Flask backend (Flask-Login, Flask-CORS, Flask-SQLAlchemy, SQLite)
- React frontend (TailwindCSS, Lucide/FontAwesome icons)
- Admin and employee login, role-based access
- WhatsApp-based OTP login for employees (OTP sent to admin's WhatsApp via local WhatsApp Web bot)
- 5 menus: Center, Collections, Sales, Employee, Accounts (CRUD for each)
- Docker/local deployment ready

## Current Status (July 2025)
- **Authentication:**
  - Admins log in directly.
  - Employees log in via OTP sent to admin's WhatsApp (valid for 60 seconds).
  - WhatsApp number is fetched from the User table (admin's MobileNumber).
- **Backend:**
  - Endpoints for OTP login: `/api/login/request_otp`, `/api/login/verify_otp`.
  - CORS enabled for frontend-backend integration.
  - All CRUD endpoints return consistent response shapes for React tables.
- **Frontend:**
  - React login flow supports two-step OTP login for employees.
  - CRUD tables robustly handle backend responses after create/update.
- **WhatsApp Bot:**
  - Requires a local Node.js WhatsApp Web bot (see code comments for setup).
- **Known Issues:**
  - Docker support is planned but not yet implemented.
  - WhatsApp bot must be running locally for OTP delivery.

## Getting Started

### Backend
1. `python -m venv venv`
2. `./venv/Scripts/Activate.ps1` (Windows)
3. `pip install -r requirements.txt`
4. `python backend/app.py`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm start`

## Deployment
- Docker support coming soon.

---

## Project Structure
- `backend/` - Flask app
- `frontend/` - React app
- `.github/copilot-instructions.md` - Copilot workspace instructions
