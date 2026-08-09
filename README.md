# TokTickIT - IT Service Desk Application

This is the starter repository for the TokTickIT full-stack application.

## Prerequisites
- Node.js
- Docker Desktop (for PostgreSQL)

## Setup Instructions

### 1. Database Setup
Start the PostgreSQL database using Docker:
```bash
docker run --name me_postgres -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=me_toktickit -p 5433:5432 -d postgres
```

### 2. Backend (Server)
Open a terminal in the `server` folder:
```bash
cd server
npm install
npm run dev
```

### 3. Frontend (Client)
Open another terminal in the `client` folder:
```bash
cd client
npm install
npm run dev
```