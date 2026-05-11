---
name: doorly-supabase-change
description: Use this skill when a Doorly change may require Supabase schema, RLS, Edge Functions, storage, or database policy changes.
---
 
# Doorly Supabase Change Skill
 
Use this workflow whenever a requested change may affect Supabase.
 
Before proposing any code or database edits, work through the following sections:
 
---
 
## 1. Current Supabase usage
Inspect the codebase and identify:
- Tables, columns, and types currently referenced in code.
- Existing RLS policies related to this change.
- Existing Edge Functions or storage buckets involved.
Do not assume what exists. Inspect first.
 
## 2. RLS review
Before proposing new RLS policies:
- List the existing policies on affected tables.
- Explain whether the new change requires adding, modifying, or replacing them.
- Flag any conflict or overlap with existing policies.
## 3. What the change requires
Explain whether the change requires any of the following — for each item, specify yes/no and describe:
- New column
- New table
- New enum or status value
- Migration file
- RLS policy update
- Supabase type regeneration (`supabase gen types`)
- Edge Function change or addition
- Storage bucket or storage policy change
## 4. Does this affect real user data?
State clearly whether the change touches sensitive data:
- User addresses or exact location data
- Payment records or Mercado Pago references
- Reservation state or confirmation status
- User identity or auth data
- Any personally identifiable information
If yes, flag the privacy and security implications explicitly.
 
## 5. Frontend vs database separation
Separate the proposed changes into two distinct sections:
- **Frontend changes** — components, API calls, types, UI
- **Database changes** — SQL, migrations, RLS, Edge Functions
Do not mix them.
 
## 6. Proposed SQL / migration
Write the SQL or migration in a separate code block.
Label it clearly as a proposal, not something to apply immediately.
 
## 7. Rollback strategy
Explain how to undo the change if something goes wrong:
- Is the migration reversible?
- Is there a down migration?
- What happens to existing data if the change is reverted?
## 8. Privacy and security implications
Explain any risk related to:
- Data exposure through RLS gaps
- Address visibility before payment confirmation
- Admin access boundaries
- User data leakage through new queries or endpoints
## 9. Post-migration validation checklist
After the migration is applied, verify:
- [ ] Supabase types regenerated and committed
- [ ] Frontend compiles without type errors
- [ ] RLS tested for each affected role (seeker, owner, admin, unauthenticated)
- [ ] No existing feature broken by schema change
- [ ] Edge Functions deployed if changed
## 10. Production access
Never assume access to the production database.
Never apply migrations without explicit user approval.
If Supabase MCP is available, use it in read-only mode for inspection only.
 
---
 
Do not apply any migration or database change until the user explicitly approves.
 
Approval means the user says "ok", "adelante", "hacelo", "dale" or similar with clear intent to proceed.
"Suena bien" or "interesante" does not count as approval.