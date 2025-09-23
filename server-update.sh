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

# Build the application
pnpm run build

# Restart the application (assuming PM2 is used)
pm2 restart lvx

echo "Server update complete!"
echo "Please check the application to ensure it's working correctly."
