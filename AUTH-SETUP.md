# Authentication Setup Guide

This guide explains how to set up the authentication system for the FreeSpeech.Live platform using your existing Supabase project and database tables.

## Overview

The authentication system uses Supabase for user authentication and connects to your existing database tables. The system supports:

- Google OAuth authentication
- Protected routes that require authentication
- Integration with your existing users and skills tables

## Setup Steps

### 1. Supabase Authentication Configuration

1. In your existing Supabase project, go to Authentication > Providers
2. Enable Google OAuth:
   - Go to Authentication > Providers > Google
   - Enable Google authentication
   - Create OAuth credentials in the [Google Cloud Console](https://console.cloud.google.com/):
     - Create a new project (or use an existing one)
     - Configure the OAuth consent screen
     - Create OAuth 2.0 Client ID
     - Add authorized redirect URIs: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - Add the Client ID and Client Secret to Supabase
3. Configure the Redirect URL in Supabase:
   - Go to Authentication > URL Configuration
   - Add your site URL: `https://yourdomain.com/auth/callback` (and `http://localhost:3000/auth/callback` for development)

### 2. Environment Variables

Your `.env.local` file should contain:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- The `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` should already be set correctly
- Set `NEXT_PUBLIC_SITE_URL` to your site's URL

### 3. Existing Database Tables

The authentication system uses your existing database tables:

- `users`: User profile information (id, name, avatar, bio, location, etc.)
- `skills`: Available skills that users can select
- `user_skills`: Junction table connecting users to their skills

No additional tables need to be created as your database already has all the necessary tables.

### 4. Protected Routes

Routes that require authentication should be placed in the `app/(protected)` directory. These routes will automatically redirect unauthenticated users to the login page.

### 5. Authentication Flow

1. Users can sign in via:
   - Google OAuth
   - Anonymous (continue without signing in)

2. After authentication, users complete the onboarding process:
   - Profile information (name, bio, avatar)
   - Skills and interests

3. User data is stored in your existing database tables and the user is redirected to the home page

## API Endpoints

- `/auth/callback`: OAuth callback handler
- `/api/me/profile`: Update user profile
- `/api/me/bootstrap`: Ensure user profile exists

## Troubleshooting

- **Authentication Errors**: Check the Supabase dashboard for authentication logs
- **Database Errors**: Verify your database connection and permissions
- **Redirect Issues**: Ensure the redirect URLs are correctly configured in Supabase
