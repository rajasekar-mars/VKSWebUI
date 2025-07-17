# VKSWebUI

## Project Overview
VKSWebUI is a full-stack web application with:
- **Flask backend** (Flask-Login, Flask-CORS, Flask-SQLAlchemy, SQLite)
- **React frontend** (TailwindCSS, Lucide/FontAwesome icons)
- **WhatsApp bot** integration (Node.js, whatsapp-web.js)
- **Role-based access** for admin and employees
- **CRUD menus**: Center, Collections, Sales, Employee, Accounts

## Project Structure

```
backend/         # Flask backend (API, models, routes)
frontend/        # React frontend (UI, TailwindCSS)
whatsapp-bot/    # Node.js WhatsApp bot
instance/app.db  # SQLite database
requirements.txt # Python backend dependencies
package.json     # Node.js dependencies (frontend & bot)
```

## Setup Instructions

### 1. Backend (Flask)

1. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Run the backend server:
   ```powershell
   python backend/app.py
   ```

### 2. Frontend (React)

1. Install dependencies:
   ```powershell
   cd frontend
   npm install
   ```
2. Start the React development server:
   ```powershell
   npm start
   ```
3. The app runs at [http://localhost:3000](http://localhost:3000)

### 3. WhatsApp Bot

1. Install dependencies:
   ```powershell
   cd whatsapp-bot
   npm install
   ```
2. Start the bot:
   ```powershell
   node bot.js
   ```

## Usage Flow

1. **Login**: Admin/Employee logs in via the React frontend. OTP is required if enabled.
2. **Role-based Menus**: After login, users see menus based on their role (admin/employee).
3. **CRUD Operations**: Each menu (Centers, Collections, Sales, Employees, Accounts) allows Create, Read, Update, Delete on the corresponding table.
4. **WhatsApp Bot**: The bot can be used for automated WhatsApp messaging (see `whatsapp-bot/bot.js`).

## Notes
- All dependencies are managed via `requirements.txt` (Python) and `package.json` (Node.js/React).
- The backend uses SQLite by default (see `instance/app.db`).
- For production, configure environment variables and secure credentials as needed.

## License
ISC
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
