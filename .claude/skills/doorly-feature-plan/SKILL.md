---
name: doorly-feature-plan
description: Use this skill before implementing a new Doorly feature. It analyzes product, UX, code, Supabase, payments, reservations, admin, and privacy impact before editing.
---
 
# Doorly Feature Planning Skill
 
When the user asks to add or change a Doorly feature, do not edit immediately.
 
First inspect the codebase for existing related logic. Then produce a structured plan with the following sections:
 
---
 
## 1. Feature summary
Brief description of what the feature does.
 
## 2. User problem solved
What problem or friction does this resolve, and for whom?
 
## 3. Does something similar already exist?
Search the codebase before proposing. If similar logic exists, explain where and how the new feature relates to it. Do not duplicate existing logic.
 
## 4. Affected user roles
- seeker / renter
- owner / host
- admin
- unauthenticated visitor
## 5. Affected product areas
- listing creation
- listing detail
- search
- reservation
- payment
- post-payment chat
- reviews
- admin approval
- legal / privacy
## 6. Affected technical areas
- frontend only
- Supabase schema
- RLS
- Edge Functions
- Mercado Pago
- Mapbox
- email
## 7. Files likely involved
List specific files or folders. Do not list files you have not inspected or that are clearly unrelated.
 
## 8. Database changes needed
Describe any new tables, columns, enums, RLS policies, or Edge Functions required.
If there are database changes, flag that the `doorly-supabase-change` skill should be used for that step before any migration is applied.
 
## 9. Risks
List technical, privacy, security, or UX risks. Flag anything that touches auth, payments, reservations, address visibility, admin permissions, or RLS.
 
## 10. Minimal implementation plan
Step-by-step plan using the smallest viable change. Prefer targeted edits over broad refactors.
 
## 11. Rollback plan
What would be undone if the feature needs to be reverted? Is it reversible without a migration? If a migration is involved, describe how to roll it back safely.
 
## 12. Validation checklist
Minimum steps to confirm the feature works correctly:
- [ ] lint
- [ ] typecheck
- [ ] build
- [ ] manual test path (describe the steps)
- [ ] edge cases to verify
---
 
Do not edit any files until the user explicitly approves the plan.
 
Approval means the user says "ok", "adelante", "hacelo", "dale" or similar with clear intent to proceed.
"Suena bien" or "interesante" does not count as approval.