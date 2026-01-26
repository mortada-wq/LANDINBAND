# Layered Relief Art App

## Preview the project locally

### 1) Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="layered_relief"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="changeme123"
export CORS_ORIGINS="*"
uvicorn server:app --reload --port 8000
```

### 2) Frontend (React)
```bash
cd frontend
yarn install
export REACT_APP_BACKEND_URL="http://localhost:8000"
yarn start
```

Open http://localhost:3000 to preview the UI.

## Tests
Frontend tests currently report "No tests found":
```bash
cd frontend
yarn test --watchAll=false
```
