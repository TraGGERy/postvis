# Postvis — Free & Cheap AI Social Media Scheduler

A modern, low-cost social media scheduler and creator studio powered by **Next.js 16**, **Clerk Authentication**, and a **Zero-Cost JSON Database** (no PostgreSQL server required).

---

## ⚡ Zero-Cost Architecture

- **Database:** Local & Serverless JSON Database (`data/db.json` or `/tmp` in cloud functions). Zero server cost, zero configuration.
- **Authentication:** [Clerk](https://clerk.com) (Generous 10,000 monthly active users on the free tier).
- **AI & Multi-Channel Publishing:** [MuAPI](https://muapi.app) (YouTube, TikTok, Instagram, X, Facebook, LinkedIn, Threads, Pinterest).
- **Hosting:** Free on [Vercel](https://vercel.com), [Render](https://render.com), or self-hosted on any minimal VPS.

---

## 🚀 Quick Start (Local)

### 1. Clone & Install
```bash
git clone https://github.com/TraGGERy/postvis.git
cd postvis
npm install
```

### 2. Configure Environment (`.env`)
Create a `.env` file (copied from `.env.example`):

```env
# 1. Zero-Cost JSON Database (Enabled by default)
USE_JSON_DB="true"
JSON_DB_PATH="./data/db.json"

# 2. Clerk Authentication (Get at https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/login"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"

# 3. AI Writing & Social Integrations (Get at https://muapi.app)
MUAPIAPP_API_KEY="your_muapi_api_key"
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the studio.

---

## ☁️ Deploy to Cloud for Free (Vercel)

1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"** -> Import `TraGGERy/postvis`.
3. Add these Environment Variables in your Vercel project settings:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL` = `/login`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL` = `/sign-up`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` = `/`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` = `/`
   - `MUAPIAPP_API_KEY`
   - `USE_JSON_DB` = `true`
4. Click **Deploy**. Vercel will build and deploy the app instantly at zero server cost!

---

## 🛠️ Features

- 📅 **Interactive Content Calendar:** Schedule and plan posts across platforms.
- ✍️ **AI Post Composer:** Generate captions, titles, hashtags, and format previews.
- 📱 **Multi-Channel Publishing:** Direct publishing to YouTube, TikTok, Instagram, X/Twitter, LinkedIn, Facebook, Threads, and Pinterest.
- 🎨 **Media Asset Library:** Built-in media grid and cropper with zero database overhead.
- 🔐 **Clerk User Management:** Pre-built login and registration with social OAuth and email.
- 💾 **JSON Database:** Automatically syncs user credits, posts, tags, and media assets to disk without maintaining a PostgreSQL cluster.
