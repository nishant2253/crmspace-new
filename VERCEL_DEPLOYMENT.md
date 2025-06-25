# Vercel Deployment Guide for CRMspace

This guide covers the necessary steps to deploy your CRMspace application to Vercel.

## Pre-deployment Checklist

1. Make sure you've committed all your changes to GitHub
2. Your repository should not contain sensitive information (secrets, API keys, etc.)
3. You'll need accounts for:
   - [Vercel](https://vercel.com)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (or another cloud MongoDB provider)
   - [Upstash](https://upstash.com) (or another cloud Redis provider)

## Environment Variables

### Backend Environment Variables (Vercel)

```
# Database
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/crm

# Redis
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://<your-vercel-domain>/auth/google/callback

# AI Services
OPENAI_API_KEY=<your-openai-api-key>
NEBIUS_API_KEY=<your-nebius-api-key>

# Authentication
SESSION_SECRET=<your-session-secret>

# Frontend URL
FRONTEND_URL=https://<your-vercel-domain>

# Set to production for Vercel
NODE_ENV=production
```

### Frontend Environment Variables (Build-time)

Create or update `.env.production` in the frontend directory with:

```
VITE_PROD_API_BASE_URL=https://<your-vercel-domain>
```

This ensures the frontend knows the correct API URL when deployed to Vercel.

## Deployment Steps

1. **Push your repository to GitHub**

2. **Connect to Vercel**

   - Go to [Vercel](https://vercel.com) and sign in
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: "Other"
     - Root Directory: "./"
     - Build Command: `cd frontend && npm install && npm run build && cd ../backend && npm install`
     - Output Directory: `frontend/dist`
     - Install Command: `npm install && cd frontend && npm install && cd ../backend && npm install`

3. **Set Environment Variables**

   - Scroll down to the "Environment Variables" section
   - Add all the backend variables listed above
   - Make sure to replace placeholders with actual values

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete

## Google OAuth Configuration

1. **Update Google Cloud Console settings**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Select your project
   - Navigate to "APIs & Services" > "Credentials"
   - Edit your OAuth 2.0 Client ID
   - Add your Vercel domain to Authorized JavaScript origins: `https://<your-vercel-domain>`
   - Add your callback URL to Authorized redirect URIs: `https://<your-vercel-domain>/auth/google/callback`

## Troubleshooting

- **Check logs**: If your deployment fails, check the logs in Vercel's dashboard
- **Environment variables**: Make sure all variables are correctly set
- **CORS issues**: If you experience CORS issues, verify that your backend CORS configuration includes your Vercel domain
- **OAuth errors**: If Google login fails, double-check your OAuth configuration in Google Cloud Console and ensure the callback URLs are correctly set

## Known Limitations

- Long-running processes like the Redis stream consumer may not work well in a serverless environment
- You might need to consider separating your frontend and backend deployments
- For production, consider using a proper message queue system instead of Redis streams

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
