# Team Task Manager

A polished full-stack team task manager built with **FastAPI + React + Vite** for project and task tracking, role-based access, and Railway deployment.

## Assessment-ready features

- Authentication: signup and login with JWT bearer tokens
- Project creation and team membership management
- Role-based access control: Admin and Member roles
- Task creation, assignment, status tracking, and due dates
- Dashboard metrics: project count, assigned tasks, overdue tasks, and status breakdown
- Persistent SQL database using SQLite
- Railway-friendly deployment with a single `Dockerfile`

## Architecture

- `backend/` — FastAPI backend with authentication, project/task APIs, and SQLite persistence
- `frontend/` — React/Vite SPA for login/signup, dashboard, team management, and task workflows
- `Dockerfile` — builds frontend assets and packages the backend for deployment
- `.dockerignore` — keeps local and build artifacts out of the container

## Run locally

### Backend

1. Activate the virtual environment:
   ```powershell
   d:\RestProject\.venv\Scripts\Activate.ps1
   ```
2. Install backend dependencies:
   ```powershell
   .venv\Scripts\python.exe -m pip install -r backend/requirements.txt
   ```
3. Start the backend:
   ```powershell
   .venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
   ```

### Frontend

1. Open a separate terminal and change directory:
   ```powershell
   cd d:\RestProject\frontend
   ```
2. Install frontend dependencies:
   ```powershell
   npm install
   ```
3. Start the frontend:
   ```powershell
   npm run dev
   ```

Then open `http://localhost:5173/` in your browser.

## Deployment on Railway

This repo is ready for Railway deployment via Docker.

1. Push the repository to GitHub.
2. Create a new Railway project and connect the GitHub repository.
3. Configure Railway to build using the root `Dockerfile`.
4. Railway will publish the full-stack app using the assigned `PORT`.

## API endpoints

- `POST /auth/signup` — register a new user
- `POST /auth/login` — authenticate and receive a JWT token
- `GET /users/me` — current user profile
- `GET /projects` — list projects for the logged-in user
- `POST /projects` — create a new project
- `POST /projects/{project_id}/members` — invite or update project members
- `GET /projects/{project_id}/tasks` — list tasks for a project
- `POST /projects/{project_id}/tasks` — create a task
- `PATCH /tasks/{task_id}` — update task status, assignee, or due date
- `GET /dashboard` — retrieve team dashboard metrics

## Notes

- Use `Authorization: Bearer <token>` for authenticated API calls.
- The frontend stores the token in localStorage for the session.
- Railway deployment uses `PORT` automatically and serves the built frontend from `frontend/dist`.

## Recommended submission

- Live URL: Railway deployment URL
- GitHub repo: this repository
- README: this file
- Demo video: record 2-5 minutes showing signup/login, project/task creation, role-based access, and deployment URL
