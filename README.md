# Yeros Auto Services LLC

Administrative application built with React, Vite, Express and MongoDB.

## Requirements

- Node.js 18 or newer
- MongoDB running locally on port 27017

## Setup

Start your local MongoDB service first. The application will create the
database and initial admin automatically on the first API start.

```powershell
npm run install:all
npm run server
```

Open a second terminal:

```powershell
npm run client
```

The frontend runs at `http://localhost:5173` and the API at
`http://localhost:5000/api`.

The public customer homepage is available at `/`. The administrative portal
remains available at `/login`.

To test on a phone connected to the same Wi-Fi network, open the computer's
local IPv4 address with port 5173, for example:

```text
http://10.0.0.194:5173
```

## Default admin

- Email: `admin@yerosautoservices.com`
- Password: `Admin123!`

Change the credentials and `JWT_SECRET` in `server/.env` before deployment.
The configured local database is:

```text
mongodb://localhost:27017/yerosautoservices
```

## Tests

The API integration suite uses an isolated in-memory MongoDB instance:

```powershell
cd server
npm test
```

## Public deployment

For a public website, use a cloud MongoDB database such as MongoDB Atlas and
deploy the project as one Node.js web service. Express serves the React build
when `NODE_ENV=production`.

Recommended deploy settings:

```text
Build command: npm run install:all && npm run build
Start command: npm start
```

Production environment variables:

```text
NODE_ENV=production
PORT=10000
MONGO_URI=mongodb+srv://USER:PASSWORD@CLUSTER/yerosautoservices
JWT_SECRET=use-a-long-random-secret
ADMIN_NAME=Yeros Auto Services
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=use-a-strong-password
CLIENT_URL=https://your-domain.com
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
```

Important before making it public:

- Change the default admin email and password.
- Use a long random `JWT_SECRET`.
- Do not use local MongoDB for a public deployment unless the server is
  hardened and backed up.
- Point your domain DNS to the hosting provider after the site is live.

## Available modules

- Protected admin login
- Dashboard metrics and recent work orders
- Customer CRUD
- Vehicle CRUD linked to customers
- Work order CRUD with service lines, labor, tax and status
- DTC diagnostic codes on work orders
- Downloadable PDF invoices
- Estimate CRUD, PDF export and conversion into work orders
- Customer search with vehicle and repair history
- AI diagnostic assistant using the OpenAI Responses API
- Integrated Lemon Manuals workspace
- Flat SVG icons throughout the Sidebar
- Persistent deep search across customers, vehicles, orders, estimates, services and DTC codes
- Read-only work order detail page with full repair, totals, DTC and invoice information
- Read-only customer and vehicle profile pages with complete history
- Monthly sales, parts cost and gross profit reporting
- Internal parts cost tracking per work-order line

Financial reports show gross profit before payroll, rent, utilities, tools,
insurance, fees and other overhead. Sales tax is excluded from revenue and
profit calculations.

## OpenAI diagnostic assistant

Create an API key at `https://platform.openai.com/api-keys`, then add it to
`server/.env`:

```text
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-5.5
```

Restart the backend after changing the environment file. The API key is used
only by Express and is never sent to the React frontend.
