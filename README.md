# Layered Relief Art App

## Preview the project locally

### 1) Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
export MONGO_URL="mongodb://localhost:27017"
export DB_NAME="layered_relief"
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="YOUR_SECURE_PASSWORD_HERE"
# Use a real password locally and avoid committing secrets to git.
export CORS_ORIGINS="http://localhost:3000"
uvicorn server:app --reload --port 8000
```

### 2) Frontend (React)
```bash
cd frontend
yarn install
export REACT_APP_BACKEND_URL="http://localhost:8000"
yarn start
```

If you prefer npm:
```bash
cd frontend
npm install
export REACT_APP_BACKEND_URL="http://localhost:8000"
npm start
```

Open http://localhost:3000 to preview the UI.

## Tests
Frontend tests currently report "No tests found" (expected until tests are added):
```bash
cd frontend
yarn test --watchAll=false
```

Backend tests require pytest and local env setup; run them after installing dependencies:
```bash
cd backend
pytest
```
