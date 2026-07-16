# 10X CRM

## About

10X CRM is a lightweight, single-user customer relationship manager built for sales
managers who juggle dozens of leads at different stages of a deal. It replaces a messy
spreadsheet with one shared client ledger: sign up, log in, browse a live dashboard,
manage clients with search/filter/sort, leave notes, and set quick follow-up reminders.
The whole app is built in vanilla JavaScript with no framework, persisting data to the
browser's `localStorage` and seeding its client list from the public DummyJSON API.

## Features

- **Sign Up / Login** with full client-side validation and duplicate-email checking.
- **Auth Guard** protecting Dashboard, Clients and Profile from unauthenticated access.
- **Dashboard**: live clock, 4 key stats (Total Clients, Active Deals, Won Revenue, New
  This Week), a Pipeline Overview by stage, and the 5 most recent clients.
- **Clients**: loads 30 clients from DummyJSON on first run, then persists locally.
  Search by name/company, filter by status, sort by recency/name/deal value, add a
  client (POST), delete a client (DELETE) with confirmation, change status inline, and
  open a details panel to read/add notes and set a "remind me in 1 minute" follow-up.
- **Profile**: edit name/company, change password, and reset the client ledger back to
  a fresh API sample.
- **Dark / light theme**, persisted across visits.
- Toast notifications and inline field validation everywhere — no `alert()`.

## Tech Stack

- **Vanilla JavaScript** (no frameworks or libraries) — ES6+, `fetch`, `async/await`.
- **HTML5 / CSS3** with CSS custom properties for theming.
- **DummyJSON** (`https://dummyjson.com`) as the mock REST API for the initial client
  list and CRUD requests.
- **localStorage** as the persistence layer (`crm_users`, `crm_session`, `crm_clients`,
  `crm_theme`).

## How to Run

This is a static site — no build step and no backend.

1. Clone the repository.
2. Open `index.html` directly in a browser, **or** serve the folder with any static
   server, e.g.:
   ```bash
   npx serve .
   # or
   python3 -m http.server 5500
   ```
3. Sign up for a new account on the Sign Up page, then log in.

## Live Demo

`<add your Vercel or Netlify URL here after deploying>`

## Test Account

No seeded account exists yet — register a new one from the Sign Up page. All account
data lives only in your browser's `localStorage`.

## Security Note

Passwords are stored in plain text in `localStorage` in this project. That is only
acceptable here because this is a learning project with no backend. In a real product,
passwords must never leave the browser in plain text or be stored anywhere unhashed —
they belong on a server, hashed and salted.

## Credits

Built solo. AI assistance was used throughout the build (see `ai-log.md` for prompts,
what was kept, what was changed, and what was learned).
