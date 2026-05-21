# ViewEasy - Modern Task Management & Dashboard

ViewEasy is a comprehensive, production-ready full-stack task management application. It features a beautiful React/Vite frontend (with a drag-and-drop Kanban board) backed by a robust Django REST Framework API. 

## Features
- **Authentication:** Standard email/password registration with real-time password strength checking (`zxcvbn`), plus Google Social Login via `@react-oauth/google` and `dj-rest-auth`.
- **Two-Factor Authentication (2FA):** Optional TOTP device binding via Google Authenticator.
- **Real-Time Push Notifications:** Powered by Django Channels, Redis, and WebSockets.
- **Background Jobs & Reminders:** Celery and Redis run scheduled tasks to notify users of high-priority and impending deadlines via Email and WebSockets.
- **Drag & Drop Kanban Board:** Intuitive frontend UI built with `@hello-pangea/dnd` for moving tasks between states instantly.
- **Task Audit Log:** Automatic history tracking of every task operation (create, update, delete) via `django-simple-history`.
- **API Documentation:** Interactive Swagger UI documentation provided by `drf-spectacular`.

## Prerequisites
- Python 3.10+
- Node.js 18+
- Redis (Running on port 6379)

## Getting Started

See the `GUIDE.md` file for full installation, configuration, and execution instructions.
