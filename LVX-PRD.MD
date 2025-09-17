Product Requirements Document (PRD) – Libertas

&nbsp;Vox (LVX)

&nbsp;1. Vision

&nbsp;Libertas Vox (LVX) is a mobile-first platform where people can propose initiatives, donate LVX tokens,

&nbsp;connect skills, and reward contributors. It empowers working-class communities to turn emotion into

&nbsp;action, bypassing centralised control, and giving individuals direct agency over what gets funded and built.

&nbsp;2. Audience \& Personas

&nbsp;Target Users

&nbsp;• 

• 

• 

• 

• 

• 

• 

• 

• 

Donors/Supporters

&nbsp;Wants: quick way to support causes they care about.

&nbsp;Frustrations: doesn’t trust centralised institutions, dislikes jargon.

&nbsp;Project Owners

&nbsp;Wants: to launch initiatives, explain goals, attract support and skills.

&nbsp;Frustrations: lacks resources, struggles to mobilise people.

&nbsp;Contributors (Skilled Workers)

&nbsp;Wants: to apply skills to meaningful causes, earn LVX rewards.

&nbsp;Frustrations: undervalued, no platform to match with causes.

&nbsp;Devices \& Usage

&nbsp;• 

• 

• 

Mobile-first (cheap Androids dominate).

&nbsp;Content habits: Facebook, Telegram, TikTok → feed, comments, simple actions.

&nbsp;Attention span: quick browsing, instant updates.

&nbsp;3. Core Features (MVP)

&nbsp;A. Onboarding \& Identity

&nbsp;• 

• 

• 

• 

• 

Social login (Google, Facebook, Apple).

&nbsp;Optional wallet connect (BNB chain, LVX support).

&nbsp;Profile setup:

&nbsp;Display name, avatar.

&nbsp;Skills (select from predefined list + free text).

&nbsp;B. Project Creation \& Discovery

&nbsp;• 

Create project wizard:

&nbsp;1

• 

• 

• 

• 

• 

• 

• 

• 

• 

• 

• 

• 

• 

• 

Step 1: Title, summary, category, region.

&nbsp;Step 2: Description, cover image, target outcomes.

&nbsp;Step 3: Review + submit.

&nbsp;Moderation step: admin approval before project goes public.

&nbsp;Project feed:

&nbsp;Cards with title, summary, fund raised, category chip.

&nbsp;Sort: Trending, Most Funded, Newest.

&nbsp;Search + filter by category/region.

&nbsp;Project detail page:

&nbsp;Title, description, owner profile.

&nbsp;Treasury total (LVX raised).

&nbsp;Donation panel.

&nbsp;Roles open (if any).

&nbsp;Comments section.

&nbsp;C. Donations

&nbsp;• 

• 

• 

• 

• 

• 

• 

• 

• 

Donate panel:

&nbsp;Input LVX amount.

&nbsp;Display project’s treasury address.

&nbsp;Paste transaction hash → submit.

&nbsp;Treasury tracking:

&nbsp;Show total LVX donated.

&nbsp;Top donors list.

&nbsp;Recent donations feed.

&nbsp;Gamification: progress bar toward target (if defined).

&nbsp;D. Skills \& Staffing

&nbsp;• 

• 

• 

• 

• 

• 

Skill listing in profiles: shown on hover/tap.

&nbsp;Project roles (manual MVP):

&nbsp;Owner defines roles (e.g., “Lawyer – 10k LVX”).

&nbsp;Contributors apply with bid + short pitch.

&nbsp;Owner reviews + accepts/rejects.

&nbsp;Reward payouts: manual LVX transfer for MVP (recorded in system as “paid”).

&nbsp;E. Voting \& Engagement

&nbsp;• 

• 

• 

• 

• 

• 

• 

• 

Comments:

&nbsp;Simple text posts.

&nbsp;Moderated (first-time comments require approval).

&nbsp;Voting:

&nbsp;Project-level polls (yes/no, multiple choice).

&nbsp;Off-chain signed votes stored in DB.

&nbsp;Results shown as % bar charts.

&nbsp;Follow/Subscribe: users can follow projects → get updates.

&nbsp;2

4\. UI / UX Flows

&nbsp;Flow 1: Onboarding

&nbsp;1. 

2\. 

3\. 

4\. 

User downloads app (or installs PWA).

&nbsp;Signs in with Google/Facebook.

&nbsp;Creates profile → name, avatar, skills.

&nbsp;Lands on home feed → sees list of projects.

&nbsp;Flow 2: Donating

&nbsp;1. 

2\. 

3\. 

4\. 

5\. 

User taps a project card.

&nbsp;Sees project page, taps “Donate LVX.”

&nbsp;Enters amount, copies treasury address.

&nbsp;Sends LVX in wallet app, pastes tx hash.

&nbsp;Donation appears in “Recent Activity.”

&nbsp;Flow 3: Creating a Project

&nbsp;1. 

2\. 

3\. 

4\. 

User taps “Create Project.”

&nbsp;Completes 3-step wizard.

&nbsp;Submits → status = “Pending.”

&nbsp;Admin approves → project goes live in feed.

&nbsp;Flow 4: Staffing a Project

&nbsp;1. 

2\. 

3\. 

4\. 

5\. 

Project owner posts role → “Designer, 5k LVX.”

&nbsp;Contributors browse projects, tap “Apply.”

&nbsp;Submit bid + message.

&nbsp;Owner reviews applicants, selects winner.

&nbsp;Payment handled manually (LVX transfer).

&nbsp;Flow 5: Voting

&nbsp;1. 

2\. 

3\. 

4\. 

User taps “Vote” on project issue.

&nbsp;Signs a message with wallet (or casts via account).

&nbsp;Vote stored in Supabase.

&nbsp;Results update live on project page.

&nbsp;5. Technical Architecture

&nbsp;• 

• 

• 

• 

• 

Frontend: React Native (or Expo → PWA \& native).

&nbsp;Backend: Supabase (Postgres, RLS, Edge Functions).

&nbsp;Auth: Social login + SIWE for wallet users.

&nbsp;Voting: Off-chain (signed messages, Supabase store).

&nbsp;Treasuries: Each project = unique address, manual tx-hash confirmation for MVP.

&nbsp;3

6\. Content \& Copy Guidelines

&nbsp;• 

• 

• 

• 

• 

Tone: Plainspoken, direct, no jargon.

&nbsp;Examples:

&nbsp;“Fund this project” instead of “Donate to treasury.”

&nbsp;“Your skills can make a difference” instead of “Submit bid to staffing module.”

&nbsp;Visuals: high-contrast, simple icons, large buttons (mobile-friendly).

&nbsp;7. Non-Goals (MVP)

&nbsp;• 

• 

• 

• 

No automated on-chain escrow (manual payouts only).

&nbsp;No complex governance mechanisms (quadratic voting, delegation later).

&nbsp;No full real-time updates (polling every 60s is enough).

&nbsp;No secondary token beyond LVX.

&nbsp;8. Risks \& Mitigation

&nbsp;• 

• 

• 

• 

Copycats: launch platform before token, LVX gets utility day one.

&nbsp;Spam projects: moderation required before publishing.

&nbsp;Low adoption: seed with a few “hero projects” to showcase value.

&nbsp;UX barrier (wallets): make wallet optional at first; donations and payouts require it.

&nbsp;9. Roadmap (MVP → Post-MVP)

&nbsp;MVP (0–3 months)

&nbsp;• 

Onboarding, profiles, project creation, donations, comments, basic voting, staffing (manual).

&nbsp;Post-MVP

&nbsp;• 

• 

• 

• 

• 

Auto donation confirmation (indexer).

&nbsp;Milestone-based escrow payouts.

&nbsp;Reputation system for contributors.

&nbsp;Quadratic voting for fairness.

&nbsp;In-app notifications.

&nbsp;4

