## AI Companion (Next.js + Supabase + Vercel AI SDK)

Minimal but production-ready chat app:

- Next.js App Router + TypeScript
- Supabase Postgres for persistence
- Vercel AI SDK streaming responses
- OpenAI chat completions

### Local setup

1. **Create a Supabase project**
2. **Run the SQL schema** (see below in this README) in the Supabase SQL editor.
3. **Set environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in the values
4. **Install & run**

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Supabase SQL schema

```sql
-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Sessions (optional but useful for tracking)
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

-- Messages
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_session_id_created_at_idx
  on public.chat_messages(session_id, created_at);

-- Security:
-- We enable RLS and rely on the server (Service Role) for reads/writes.
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- No policies are required for this app because we do NOT access tables directly from the browser.
-- Service Role bypasses RLS. If you later add authenticated users and client-side reads,
-- you can add appropriate policies.
```

