#!/bin/bash

# Script to update the LVX server with the latest changes
# This script should be run on the server

# Change to the project directory
cd /opt/lvx

# Fetch the latest changes
git fetch origin

# Checkout the feature branch
git checkout feat/debate-posts

# Pull the latest changes
git pull origin feat/debate-posts

# Install dependencies
pnpm install

# Add OpenAI API key to .env.local if it doesn't exist
if ! grep -q "OPENAI_API_KEY" .env.local; then
  echo "Adding OPENAI_API_KEY to .env.local"
  echo "OPENAI_API_KEY=your_openai_api_key_here" >> .env.local
  echo "Please edit .env.local and replace 'your_openai_api_key_here' with your actual OpenAI API key"
fi

# Add Perplexity API key to .env.local if it doesn't exist
if ! grep -q "PERPLEXITY_API_KEY" .env.local; then
  echo "Adding PERPLEXITY_API_KEY to .env.local"
  echo "PERPLEXITY_API_KEY=your_perplexity_api_key_here" >> .env.local
  echo "Please edit .env.local and replace 'your_perplexity_api_key_here' with your actual Perplexity API key"
fi

# Clear Next.js cache to ensure clean build
echo "Clearing Next.js cache..."
rm -rf .next

# Build the application
echo "Building application..."
pnpm run build

# Check for build errors
if [ $? -ne 0 ]; then
  echo "Build failed! Please check the logs above for errors."
  exit 1
fi

# Restart the application (assuming PM2 is used)
echo "Restarting application..."
pm2 restart lvx

# Tail the logs to check for startup errors
echo "Checking logs for errors..."
pm2 logs --lines 20 --nostream

# Check for specific errors in the logs
echo "Checking for specific errors..."
if pm2 logs --lines 100 --nostream | grep -q "Unterminated string in JSON"; then
  echo "WARNING: JSON parsing errors still detected in logs. The fixes may not have been applied correctly."
  echo "Please check the application and logs for more details."
else
  echo "No JSON parsing errors detected in recent logs. The fixes appear to be working."
fi

echo "Server update complete!"
echo "Please check the application to ensure it's working correctly."
echo "If you encounter any issues, check the logs with: pm2 logs"
