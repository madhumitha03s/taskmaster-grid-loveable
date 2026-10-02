# TaskMaster Grid

Build a web app called "TaskGrid" — a PGDM assignment deadline & workload tracker.

Core purpose: track assignments/deadlines across multiple courses and visualize workload distribution over time.

Data model:

- Assignment: id, title, course (dropdown: FADM, Microeconomics, OB, IT for Managers — editable list), due_date, estimated_hours, status (enum: not_started, in_progress, done), priority (enum: low, medium, high)

- User: simple auth (signup/login via Supabase)

For this stage, build only:

1. Auth (signup/login).

2. Assignment CRUD — add/edit/delete an assignment via a form (all fields above).

3. A simple list view of assignments, sortable by due_date.

Stack: React frontend, Supabase backend (your default). Keep UI functional but minimal — no dashboard/visualization yet, that's a later stage.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://deadline-dazzle-42.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/48ffa904-2f77-4174-a867-8c13619931ca).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
