# KTDash.app - A KillTeam Companion App

**KTDash** is a web-based companion app for KillTeam to view killteams and killteams, manage rosters, and track battles.

## Tech Stack

- Next.js (App Router)
- React + TypeScript
- TailwindCSS
- Prisma + MySQL
- NextAuth
- PWA + Service Worker

## Contributing

Contributions are welcome — especially bug fixes, UI suggestions, and typo corrections.

To contribute:

1. Fork this repo
2. Open a pull request
3. Describe your change clearly

## Getting Started

To run the KTDash Companion App locally, you'll need:

- Node.js 18+
- MySQL database (local or remote)
- A `.env` file with your database credentials
- Seeded core game data (killteams, optypes, weapons, abilities, etc.)

---

### 1. Clone the Repository

```bash
git clone https://github.com/vjosset/ktdash-v4.git
cd ktdash-v4
```

---

### 2. Set Up Your Environment

Create a `.env` file in the project root. You can start by copying the template:

```bash
cp .env.example .env
```

Edit the `.env` file to match your MySQL connection:

```env
# Database connection string (adjust username, password, host, db name)
DATABASE_URL="mysql://user:pass@host:3306/ktdashv4"

# Used by NextAuth.js
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

---

### 3. Install Dependencies

```bash
npm install
```

---

### 4. Set Up the Database

Create the database and all its tables:

```bash
npx prisma db push
```

Seed the database with core game data:

```bash
npm run seed
```

---

### 5. Start the App

```bash
npm run dev
```

This will start the app on `http://localhost:7000`.

---

## App Overview

- Built with [Next.js 14 App Router](https://nextjs.org/)
- Uses [Prisma](https://www.prisma.io/) with a MySQL backend
- Auth powered by [NextAuth](https://next-auth.js.org/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Designed as a PWA with service worker support
- Tracks in-game state, rules, rosters, rosterops, and equipment

---

## Optional Development Scripts

| Script | Description |
|--------|-------------|
| `npm run seed` | Seeds core game data + dev users, rosters, and test data |
| `npm run build` | Builds production app |
| `npm run start` | Starts app on port `4000` by default |

## Production Deployment

Sample `deploy.sh`:

```bash
#!/bin/bash
# Make sure to make this script executable
# chmod +x deploy.sh
# Make sure you have pm2 installed globally

set -e  # Exit on first error

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm ci --yes

echo "Generating Prisma client..."
npx prisma generate

echo "Building app..."
npm run build

echo "Starting app..."
pm2 restart ktdash-app || pm2 start npm --name ktdash-app -- run start

echo "💾 Saving PM2 process list..."
pm2 save
```
