# ViewEasy Developer Guide

Follow these steps to configure, install, and run ViewEasy locally.

## 1. Environment Configuration

### Backend (`backend/.env`)
Create a `.env` file in the `backend/` directory:
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-specific-password
```

### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory:
```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Google OAuth Setup
To resolve the `Error 401: invalid_client` or redirect errors during Google Login, ensure the following are configured in your Google Cloud Console Credentials page:
- **Authorized JavaScript origins:** `http://localhost:5173` and `http://127.0.0.1:5173`
- **Authorized redirect URIs:** `http://localhost:5173` and `http://localhost:5173/login`

## 2. Backend Setup
1. **Activate Virtual Environment:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```
2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Database Migrations:**
   ```bash
   python manage.py migrate
   ```
4. **Create Superuser (Optional):**
   ```bash
   python manage.py createsuperuser
   ```

## 3. Running the Application

ViewEasy requires **three** backend processes and **one** frontend process to run simultaneously:

### Process 1: Redis Server
Ensure Redis is installed and running on your system (defaults to `localhost:6379`).

### Process 2: Django ASGI Server (Daphne)
Because ViewEasy uses WebSockets, we use Daphne instead of `runserver`.
```bash
cd backend
daphne -p 8000 backend.asgi:application
```

### Process 3: Celery Worker
Handles background tasks and email reminders.
```bash
cd backend
celery -A backend worker -l info
```

### Process 4: React Frontend
```bash
cd frontend
npm install
npm run dev
```

## 4. API Documentation
Once the Django server is running, navigate to:
- **Swagger UI:** `http://localhost:8000/api/docs/`
- **OpenAPI Schema:** `http://localhost:8000/api/schema/`
