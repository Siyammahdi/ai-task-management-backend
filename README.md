# 🚀 Smart Task Manager — Backend

This is the **backend API** for the **Smart Task Manager** project.  
It’s built with **Express**, **TypeScript**, **Prisma ORM**, and uses a **PostgreSQL** database (managed via **Supabase**).

---

## 📂 Tech Stack

- **Express.js** — Lightweight Node.js server
- **TypeScript** — Type safety for better development
- **Prisma ORM** — Modern type-safe database client
- **PostgreSQL** — Relational database
- **Supabase** — Hosting the Postgres DB + Auth
- **Google Gemini API** — AI-powered subtask suggestions

---

## ✅ Features

- RESTful API endpoints for tasks and subtasks
- AI-powered subtask suggestions (Google Gemini)
- Secure environment variable management
- PostgreSQL migrations with Prisma
- Ready for deployment (serverless or Node)

---

## ⚙️ Setup Instructions

### Clone the repository

```bash
git clone https://github.com/Siyammahdi/ai-task-management-backend.git
cd smart-task-manager-backend
```

### Install dependencies

```bash
pnpm install
```

## 🔑 Environment Variables

Create a `.env` file in the root of your project to store **sensitive keys** and **configuration values**.

Here’s an example `.env` for this project:

```env
DATABASE_URL=your_supabase_postgres_connection_string
DIRECT_URL=your_supabase_postgres_direct_url
GEMINI_API_KEY=your_google_gemini_api_key_here
PORT=4000
```

### Run the project locally

```bash
pnpm dev
```


Then open [http://localhost:4000](http://localhost:4000) in your browser.

---
