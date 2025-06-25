# Vercel Deployment Guide for CRMspace with React Bits Components

This guide covers the necessary steps to deploy your enhanced CRMspace application with React Bits components to Vercel.

## Pre-deployment Checklist

1. Make sure you've committed all your changes to GitHub
2. Your repository should not contain sensitive information (secrets, API keys, etc.)
3. You'll need accounts for:
   - [Vercel](https://vercel.com)
   - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (or another cloud MongoDB provider)
   - [Upstash](https://upstash.com) (or another cloud Redis provider)

## Deployment Architecture

For optimal performance, we'll deploy three separate Vercel projects:

1. **Frontend**: The React application with React Bits components
2. **Backend API**: The Express.js API server
3. **Stream Consumer**: A separate service for processing Redis streams

## Environment Variables

### Backend Environment Variables

```
# Database
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/crm

# Redis(Optional)
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<your-redis-password>
REDIS_TLS=true

# Recommended way to use REDIS_URL

REDIS_URL=redis://default:************************exact-koi-10740.upstash.io:6379

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://<your-backend-domain>/auth/google/callback

# AI Services
OPENAI_API_KEY/Github_Token=<your-openai-api-key>
NEBIUS_API_KEY=<your-nebius-api-key>

# Authentication
SESSION_SECRET=<your-session-secret>

# Frontend URL (CORS)
FRONTEND_URL=https://<your-frontend-domain>

# Set to production for Vercel
NODE_ENV=production
```

### Frontend Environment Variables

```
VITE_PROD_API_BASE_URL=https://<your-backend-domain>
VITE_NODE_ENV=production
```

### Stream Consumer Environment Variables

```
# Same as backend environment variables
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/crm
REDIS_HOST=<your-redis-host>
REDIS_PORT=6379
REDIS_PASSWORD=<your-redis-password>
REDIS_TLS=true
NODE_ENV=production
```

## Deployment Steps

### 1. Frontend Deployment

1. Navigate to Vercel and create a new project
2. Import your GitHub repository
3. Configure the project:
   - Framework Preset: "Vite"
   - Root Directory: "frontend"
   - Build Command: `npm run vercel-build`
   - Output Directory: "dist"
   - Install Command: `npm install`
4. Add environment variables from the Frontend section above
5. Click "Deploy"

### 2. Backend API Deployment

1. Create a new project in Vercel
2. Import the same GitHub repository
3. Configure the project:
   - Framework Preset: "Other"
   - Root Directory: "backend"
   - Build Command: `npm run vercel-build`
   - Output Directory: "."
   - Install Command: `npm install`
4. Add environment variables from the Backend section above
5. Click "Deploy"

### 3. Stream Consumer Deployment

1. Create a new project in Vercel
2. Import the same GitHub repository
3. Configure the project:
   - Framework Preset: "Other"
   - Root Directory: "backend"
   - Build Command: `npm run vercel-build`
   - Output Directory: "."
   - Install Command: `npm install`
   - Override settings with `stream-consumer-vercel.json`
4. Add environment variables from the Stream Consumer section above
5. Click "Deploy"

## Important Notes for React Bits Components

1. **Animation Performance**: React Bits components use Framer Motion for animations. To ensure optimal performance, we've set initial values for all animated properties.

2. **Box Shadow Animation**: We fixed the box shadow animation in `AnimatedCard` component by providing proper initial values.

3. **Environment-specific Rendering**: Some animations may be disabled in production to improve performance. This is controlled via the `VITE_NODE_ENV` environment variable.

## Troubleshooting

### Animation Issues

If you encounter animation issues in the deployed version:

1. Check browser console for errors
2. Verify that `framer-motion` is properly installed
3. Ensure that all animated properties have proper initial values

### Redis Stream Consumer Issues

The stream consumer is deployed as a serverless function, which has limitations:

1. Serverless functions have execution time limits (60 seconds in our configuration)
2. For production use, consider using a dedicated server or a service like AWS EC2 for the stream consumer

### CORS Issues

If you experience CORS issues:

1. Verify that the `FRONTEND_URL` environment variable in the backend deployment matches your frontend URL exactly
2. Check that your backend CORS configuration includes your frontend domain

## Monitoring and Maintenance

1. **Vercel Dashboard**: Monitor your deployments through the Vercel dashboard
2. **Logs**: Check function logs for any errors
3. **Usage**: Keep an eye on your serverless function usage to avoid unexpected costs

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [React Bits Documentation](https://github.com/DavidHDev/react-bits)
