# Apex Bank

Apex Bank is a responsive online banking dashboard demo for customers, staff, and administrators. It brings account activity, money movement, and loan workflows together in one role-based application.

**Live demo:** [apex-bank-2iqr.vercel.app](https://apex-bank-2iqr.vercel.app)

> This project is for demonstration and learning. Do not use it to manage real money or sensitive financial data.

## Features

### Customer

- View accounts and balances.
- Make deposits, withdrawals, and transfers.
- Review transaction history and download a PDF account statement.
- Apply for loans, track applications, and repay an existing loan.

### Staff

- Register customers and create customer accounts.
- View and update customer and account information.
- Review loan applications.

### Administrator

- View customers, accounts, and transactions.
- Block or unblock customer sign-in.
- Freeze or unfreeze bank accounts.
- Review loan applications and account activity.

## Technology

- Next.js App Router, React, and TypeScript
- Tailwind CSS and HeroUI
- Better Auth for email/password authentication and role-based access
- MongoDB for application and authentication data
- jsPDF for downloadable account statements
- Vercel for deployment

## Demo accounts

Add the demo credentials here after creating the corresponding test accounts. No demo users or passwords are included in the repository.

| Role | Email | Password |
| --- | --- | --- |
| Administrator | mdshahdath36@gmail.com | mdshahdath36@gmail.comA |
| Staff | hmdshahdat125@gmail.com | hmdshahdat125@gmail.comA |
| Customer | support1@appleemart.com | support1@appleemart.comA |

Keep demo users limited to test data. Never add production credentials or real user passwords to this file.

## Run locally

### Requirements

- Node.js 20.9 or newer
- npm
- A MongoDB database

### Setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy the environment template:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   On macOS or Linux, use `cp .env.example .env.local`.

3. Set the required values in `.env.local`:

   ```dotenv
   MONGODB_URI=
   BETTER_AUTH_SECRET=
   BETTER_AUTH_URL=http://localhost:3000
   ```

   `BETTER_AUTH_SECRET` must be at least 32 characters. Keep the MongoDB URI and auth secret private; do not commit `.env.local`.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

New self-registered users receive the customer role by default. Administrator and staff demo accounts must be provisioned with the appropriate roles before adding their credentials to the table above.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |

## Deploy to Vercel

Configure these environment variables in the Vercel project settings:

- `MONGODB_URI` — connection string for the MongoDB deployment.
- `BETTER_AUTH_SECRET` — a private secret of at least 32 characters.
- `BETTER_AUTH_URL` — the deployed site's public HTTPS origin, for example `https://apex-bank-2iqr.vercel.app`.

Set them for the required Vercel environments, then redeploy. Do not place secret values in this README or commit them to Git.
