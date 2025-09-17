🤖 Feature Specification: AI Project Assistant (FreeSpeech.Live)

1\. Purpose



To help project creators design structured, actionable initiatives by providing AI-guided suggestions for goals, milestones, roles, and donor pitches.

The assistant lowers the barrier to entry, ensures project quality, and empowers non-experts to participate.



2\. User Stories



As a Project Owner, I want AI suggestions for structuring my idea so I don’t get stuck when creating a project.



As a Supporter, I want projects to be clearly defined (goals, staffing, timeline) so I can decide where to donate.



As a Contributor, I want to see specific role requirements so I can match my skills to projects.



3\. Core Features

A. Project Wizard with AI Help



Step 1: User enters goal (e.g., “Protect free speech in schools”).



Step 2: AI suggests project type, key milestones, and target audience.



Step 3: AI generates staffing needs (roles + skills).



Step 4: AI drafts a donor pitch summary (editable by user).



B. Smart Staffing



AI maps project requirements to skills already in the community (via Supabase profile data).



Highlights “critical missing skills” vs “available skills.”



C. Donor Pitch Support



Generates a short, engaging description (“Why fund this?”).



Suggests images/icons from a small curated library (not AI-generated at MVP).



D. AI Tone Controls



Simple options: Professional / Activist / Inspirational.



Ensures project text matches the emotional intent of the creator.



4\. UX Flow



User starts “Create Project” wizard.



Enters rough idea in free text.



Sees “Need help?” → taps AI Suggest.



AI fills in milestones, roles, and draft pitch.



User reviews → edits → finalizes.



Submits project for moderation.



5\. Technical Architecture



Frontend: Add “AI Suggest” buttons to each step of project creation form.



Backend:



Supabase to store user input + AI output.



Call to OpenAI/Anthropic or similar API for text generation.



Simple prompt design: user goal → structured JSON (milestones, roles, pitch).



Constraints:



Limit to 2–3 AI calls per project creation (cost control).



Always require human review before publishing.



6\. Guardrails



AI is a guide, not a decision-maker.



Output is editable at every step.



Add disclaimer: “AI-generated suggestions — please review and adjust.”



Content moderation step still required before project goes live.



7\. Future Enhancements



AI-trained on successful projects in FreeSpeech.Live for better relevance.



Multilingual support: AI generates pitches in the user’s chosen language.



AI Coach mode: conversational Q\&A (like ChatGPT) guiding project planning.



AI Progress tracking: suggests task updates, nudges owners to post milestones.

