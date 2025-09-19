# Authentication Setup Guide

This guide explains how to set up the authentication system for the FreeSpeech.Live platform.

## Overview

The authentication system uses Supabase for user authentication and Drizzle ORM for database operations. The system supports:

- Google OAuth authentication
- Email OTP (One-Time Password) authentication
- User profiles with skills and roles
- Protected routes that require authentication

## Setup Steps

### 1. Supabase Configuration

1. Create a new project in the [Supabase Dashboard](https://app.supabase.com/)
2. Enable the Authentication service
3. Configure Google OAuth:
   - Go to Authentication > Providers > Google
   - Enable Google authentication
   - Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/):
     - Create a new project
     - Configure the OAuth consent screen
     - Create OAuth 2.0 Client ID
     - Add authorized redirect URIs: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - Add the Client ID and Client Secret to Supabase
4. Configure the Redirect URL in Supabase:
   - Go to Authentication > URL Configuration
   - Add your site URL: `https://yourdomain.com/auth/callback` (and `http://localhost:3000/auth/callback` for development)

### 2. Environment Variables

Create a `.env.local` file based on the `.env.example` template:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database Configuration (for Drizzle)
DATABASE_URL=postgres://postgres:password@localhost:5432/postgres

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- Get the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project settings
- Set `DATABASE_URL` to your Postgres database connection string
- Set `NEXT_PUBLIC_SITE_URL` to your site's URL

### 3. Database Setup

The database schema is defined in `db/schema.ts` and includes tables for:

- `profiles`: User profile information
- `userRoles`: User roles (user, creator, admin, moderator)
- `userSkills`: User skills and interests
- `accounts`: Authentication provider information

To create these tables in your database:

```bash
# Generate SQL migrations
pnpm db:generate

# Apply migrations to the database
pnpm db:push
```

### 4. Protected Routes

Routes that require authentication should be placed in the `app/(protected)` directory. These routes will automatically redirect unauthenticated users to the login page.

### 5. Authentication Flow

1. Users can sign in via:
   - Google OAuth
   - Email OTP (coming soon)
   - Anonymous (continue without signing in)

2. After authentication, users complete the onboarding process:
   - Profile information (name, bio, avatar)
   - Skills and interests

3. User data is stored in the database and the user is redirected to the home page

## API Endpoints

- `/auth/callback`: OAuth callback handler
- `/api/me/profile`: Update user profile
- `/api/me/bootstrap`: Ensure user profile exists

## Switching to Linode Postgres

The authentication system is designed to be portable. To switch from Supabase Postgres to Linode Postgres:

1. Update the `DATABASE_URL` in your environment variables to point to your Linode Postgres instance
2. Run the database migrations on the Linode server
3. The authentication will continue to use Supabase, but all user data will be stored in your Linode database

## Troubleshooting

- **Authentication Errors**: Check the Supabase dashboard for authentication logs
- **Database Errors**: Verify your database connection string and permissions
- **Redirect Issues**: Ensure the redirect URLs are correctly configured in Supabase
