# Patent Management System 📜🏛️

A role-based web application for college Intellectual Property (IP) Cells to manage, scrutinize, evaluate, and track patent applications from submission to filing.

---

## 🛠️ Technology Stack

* **Backend**: Django 4.2 LTS, Django REST Framework (DRF), SimpleJWT, SQLite (Development), PostgreSQL (Production)
* **Frontend**: React 18, Vite, Custom CSS
* **Tooling & IDE Support**: Python Virtual Environment (`.venv`), Pyright/Pylance, Pyrefly, Docker Compose

---

## 📁 Repository Structure

```text
patent-management-system/
├── backend/                  # Django REST Framework Backend
│   ├── apps/                 # Modular Django Apps
│   │   ├── authentication/   # User accounts, JWT auth & Custom User model
│   │   ├── departments/      # College department master data & serializers
│   │   ├── patents/          # Patent application lifecycle & ID generator
│   │   ├── workflow/         # Role-gated status transitions & event history
│   │   ├── reviews/          # Scrutinizer/Consultant review remarks & feedback
│   │   ├── documents/        # File attachments & disclosures
│   │   ├── audit/            # Audit log (planned)
│   │   ├── notifications/    # In-app notifications (planned)
│   │   └── common/           # Shared utilities
│   ├── config/               # Django Settings (dev.py, prod.py, base.py)
│   ├── manage.py             # Django CLI management script
│   └── requirements.txt      # Python dependencies & type stubs
├── frontend/                 # React + Vite Frontend Application
│   ├── src/                  # React components, pages & styles
│   └── package.json          # Node dependencies & scripts
├── .vscode/                  # Workspace IDE configuration
├── pyproject.toml            # Python tool configuration & stubs
├── pyrefly.toml              # Pyrefly linter search paths
├── pyrightconfig.json        # Pylance/Pyright type checker setup
└── docker-compose.yml        # Docker container orchestration
```

---

## 🚀 Quick Start Guide for Teammates

### 1. Prerequisites
* Python 3.10+ (Installed on system)
* Node.js 18+ & npm

---

### 2. Backend Setup (Django)

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Create and Activate Virtual Environment**:
   * **Windows (PowerShell)**:
     ```powershell
     python -m venv ..\.venv
     ..\.venv\Scripts\Activate.ps1
     ```
   * **Mac / Linux**:
     ```bash
     python3 -m venv ../.venv
     source ../.venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Database Migrations**:
   ```bash
   python manage.py migrate
   ```

5. **Start Django Development Server**:
   ```bash
   python manage.py runserver
   ```
   * The backend API will run at: `http://127.0.0.1:8000/`

---

### 3. Frontend Setup (React + Vite)

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```

2. **Install Node Packages**:
   ```bash
   npm install
   ```

3. **Start React Dev Server**:
   ```bash
   npm run dev
   ```
   * The frontend app will run at: `http://localhost:5173/`

---

## 👥 User Roles & Workflow

1. **Applicant (Student / Faculty)**: Submits patent applications, uploads technical disclosures, tracks application status.
2. **Scrutinizer (Internal IP Cell Reviewer)**: Conducts prior art search, reviews disclosure completeness, requests revisions or approves.
3. **Consultant (Patent Attorney / External Expert)**: Evaluates technical novelty and recommends formal patent filing.
4. **Admin (IP Cell Coordinator)**: Manages users, department codes, application assignments, and overall system metrics.

---

## 🌿 Git & Collaboration Workflow

### Syncing Your Fork with Teammate's Main Repository
If your teammate (repo owner) pushes updates to `main`:
```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### Working on a Feature Branch
Always create a new branch for your feature before pushing:
```bash
# 1. Create and switch to a feature branch
git checkout -b feature/setup-and-docs

# 2. Stage your modified files
git add .

# 3. Commit changes with a descriptive message
git commit -m "docs: update README setup guide and workspace configuration"

# 4. Push branch to your fork
git push -u origin feature/setup-and-docs
```
Then open a **Pull Request (PR)** on GitHub to merge into the main repository.