# The Branding Lab

Student portal for The Branding Lab by CJE Media. Lives at lab.ciarajevans.com.

- Next.js 14 (App Router), TypeScript, Tailwind
- Supabase: shares the CJE Hub project, with all tables in the `lab` schema
- Resend for Lab-branded emails, Zapier for new Skool members, Claude API for results

## Database files (run in order, in the Hub's Supabase SQL Editor)

1. `supabase/migrations/0001_lab_schema.sql`: tables, access rules, security
2. `supabase/migrations/0002_lab_seed.sql`: the seven experiments, starting copy, shared AI instructions
3. `supabase/migrations/0003_room_test_instructions.sql`: Experiment 001 result instructions
4. `supabase/setup/make-admins.sql`: makes existing Hub accounts Lab admins

Then add `lab` to Project Settings > Data API > Exposed schemas.

## Environment variables

See `.env.example`.

## How access works

Every experiment page and API call asks the database function `lab.experiment_access`
whether the signed-in student may open it (active membership, tier, previous experiment
completed, knowledge check passed). Students can only read their own rows; all writes go
through the server after that check.
