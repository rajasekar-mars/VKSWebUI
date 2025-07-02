# VKSWebUI

A full-stack web application with:
- Flask backend (Flask-Login, Flask-CORS, Flask-SQLAlchemy, SQLite)
- React frontend (TailwindCSS, Lucide/FontAwesome icons)
- Admin and employee login, role-based access
- 5 menus: Center, Collections, Sales, Employee, Accounts (CRUD for each)
- Docker/local deployment ready

## Getting Started

### Backend
1. `python -m venv venv`
2. `./venv/Scripts/Activate.ps1` (Windows)
3. `pip install -r requirements.txt` (to be created)
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
