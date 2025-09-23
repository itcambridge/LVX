# Debating Feature Documentation

## Overview

The debating feature is designed to guide users through a structured process to create more balanced, persuasive posts that focus on systems rather than groups of people. It implements an 8-stage process that helps users transform their initial thoughts into well-reasoned, civil arguments.

## Technical Implementation

### Core Components

1. **AI Schemas** (`lib/aiSchemas.ts`)
   - Zod schemas for validating AI responses at each stage
   - Ensures consistent data structure throughout the process

2. **AI Prompts** (`lib/aiPrompts.ts`)
   - System and user prompts for each stage of the process
   - Guides the AI to produce appropriate responses

3. **AI Client** (`lib/aiClient.ts`)
   - Wrapper for the OpenAI API
   - Handles JSON response formatting

4. **Research Client** (`lib/researchClient.ts`)
   - Integration with Perplexity API for fact-checking
   - Provides evidence for claims

5. **AI Planner Hook** (`hooks/useAiPlanner.ts`)
   - React hook for managing the state of the debating process
   - Handles API calls, state updates, and error handling

6. **Tone Meter Component** (`components/ai/tone-meter.tsx`)
   - Displays tone scores for the post
   - Helps users identify and fix problematic language

7. **API Endpoints**
   - `/api/ai/plan`: Routes AI requests to the appropriate stage
   - `/api/research`: Handles fact-checking requests
   - `/api/projects/save-draft`: Saves draft posts
   - `/api/projects/publish`: Publishes completed posts

### Database Schema Updates

The feature uses the existing `projects` table with the following additional columns:

- `plan_bundle`: JSON column storing the artifacts from each stage
- `routine_stage`: Integer tracking the current stage (1-8)
- `routine_completed`: Boolean indicating completion of all stages
- `tone_scores`: JSON column storing civility, heat, bridge, and factuality scores
- `sources`: JSON column storing evidence sources

## The 8-Stage Process

1. **Vent**
   - User expresses their initial thoughts and feelings
   - AI reflects the feeling and extracts neutral grievances

2. **Claims**
   - Transforms grievances into falsifiable claims
   - Identifies evidence categories needed

3. **Steelman & Stakeholders**
   - Creates good-faith steelman arguments for opposing views
   - Maps stakeholders and their concerns

4. **SMART Goals**
   - Proposes specific, measurable, achievable, relevant, time-bound goals
   - Includes metrics and legitimacy checks

5. **Plan Options**
   - Generates three plan options: Fast/Low-cost, Balanced, and Ambitious
   - Includes timelines, budgets, and risks

6. **Task Board**
   - Lists roles needed for implementation
   - Creates a 6-8 week sprint plan

7. **Draft Story**
   - Crafts a 400-600 word post in Nonviolent Communication style
   - Includes shared values, steelman nod, goals, and specific requests

8. **Tone Score**
   - Scores the post on civility, heat, bridge-building, and factuality
   - Offers rewrites if scores are below thresholds

## Usage

1. Navigate to `/post/create`
2. Complete each stage in sequence
3. Review and edit the final post
4. Publish when satisfied with the tone scores

## API Keys Required

- `OPENAI_API_KEY`: For the AI processing at each stage
- `PERPLEXITY_API_KEY`: For fact-checking and research (optional)

## Deployment

1. Add the required API keys to your `.env.local` file
2. Build and deploy the application
3. The feature will be accessible via the Create button, which now redirects to the new post creation flow

## Future Improvements

- Integration with more fact-checking services
- Enhanced visualization of stakeholder maps
- Collaborative editing features
- Mobile-optimized interface
