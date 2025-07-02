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

### Google OAuth Troubleshooting

If you encounter 500 Internal Server Error during Google authentication callback:

1. **Verify Authorized Redirect URIs**

   - Ensure the callback URL in Google Cloud Console **exactly** matches your Vercel domain:

   ```
   https://crmspace-backend.vercel.app/auth/google/callback
   ```

   - No trailing slashes, and the domain must match exactly what's in the browser URL

2. **Check Environment Variables**

   - Verify these variables in Vercel project settings:

   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALLBACK_URL=https://crmspace-backend.vercel.app/auth/google/callback
   ```

   - Make sure there are no typos or extra spaces

3. **Enable Proxy Support**

   - Vercel uses proxies, so your Google Strategy should include:

   ```javascript
   passport.use(
     new GoogleStrategy(
       {
         clientID: GOOGLE_CLIENT_ID,
         clientSecret: GOOGLE_CLIENT_SECRET,
         callbackURL: GOOGLE_CALLBACK_URL,
         proxy: true, // Important for Vercel deployments
       },
       callback
     )
   );
   ```

4. **Check MongoDB Connection**

   - The Google callback needs to save user data to MongoDB
   - Verify your MongoDB connection is working in the diagnostic endpoint

5. **Session Configuration**

   - Ensure Redis is properly configured for session storage
   - Check that SESSION_SECRET is set in environment variables
   - Verify CORS settings include `credentials: true`

6. **Review Vercel Logs**

   - Check function logs in Vercel dashboard for specific error messages
   - Look for MongoDB connection errors or session-related issues

7. **Test with Enhanced Logging**
   - Add detailed logging to your auth routes and passport configuration
   - Redeploy and check the logs during authentication attempts

## Troubleshooting

- **Check logs**: If your deployment fails, check the logs in Vercel's dashboard
- **Environment variables**: Make sure all variables are correctly set
- **CORS issues**: If you experience CORS issues, verify that your backend CORS configuration includes your Vercel domain
- **OAuth errors**: If Google login fails, double-check your OAuth configuration in Google Cloud Console and ensure the callback URLs are correctly set

## Backend Deployment Fixes

### Common Backend Deployment Issues and Solutions

1. **Vercel Configuration Conflicts**

   - **Issue**: `functions` and `builds` properties cannot be used together in vercel.json
   - **Solution**: Remove the `functions` property and keep the `builds` configuration

2. **404 Errors on Root Path**

   - **Issue**: Missing handler for the root path
   - **Solution**: Add a root endpoint handler in app.js:
     ```javascript
     app.get("/", (req, res) => {
       res.send("CRMspace Platform API");
     });
     ```

3. **Favicon 404 Errors**

   - **Issue**: Browsers automatically request favicon.ico causing 404 errors
   - **Solution**: Add a simple favicon handler:
     ```javascript
     app.get("/favicon.ico", (req, res) => {
       res.status(204).end(); // No content response
     });
     ```

4. **Redis Connection Issues**

   - **Issue**: Redis connection fails in production
   - **Solution**:
     - Use the correct Upstash Redis URL format: `redis://default:PASSWORD@HOSTNAME:PORT`
     - Enable TLS for production: `tls: isProduction ? { rejectUnauthorized: false } : undefined`
     - Make Redis client available to the app: `app.set('redisClient', redisClient);`

5. **MongoDB Connection Timeout**
   - **Issue**: MongoDB connection times out in serverless environment
   - **Solution**: Add connection options to MongoDB URI:
     ```
     MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/crm?retryWrites=true&w=majority&connectTimeoutMS=30000
     ```

### Diagnostic Endpoint

A diagnostic endpoint was added to help troubleshoot connection issues:

```javascript
router.get("/api/diagnostic", async (req, res) => {
  const results = {
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
    uptime: process.uptime(),
    systems: {},
  };

  // MongoDB status check
  // Redis status check
  // Session information

  res.json(results);
});
```

This endpoint provides detailed information about:

- MongoDB connection status and collections
- Redis connection details and stream information
- Session configuration and authentication status

Access this endpoint at: `https://<your-backend-url>/api/diagnostic`

### Authentication Debugging

Enhanced logging was added to the `/auth/me` endpoint to help troubleshoot authentication issues:

```javascript
router.get("/me", (req, res) => {
  console.log("Auth check - isAuthenticated:", req.isAuthenticated());
  console.log("Auth check - session exists:", !!req.session);
  console.log("Auth check - session ID:", req.sessionID);

  if (req.isAuthenticated()) {
    console.log("Auth check - user:", req.user.email || req.user._id);
    res.json(req.user);
  } else {
    console.log("Auth check - not authenticated");
    res.status(401).json({ error: "Not authenticated" });
  }
});
```

### Upstash Redis Configuration

For Upstash Redis to work correctly in production:

1. Use the REDIS_URL environment variable with the correct format:

   ```
   REDIS_URL=redis://default:PASSWORD@HOSTNAME:PORT
   ```

2. Configure Redis client with TLS for production:

   ```javascript
   redisClient = new Redis(process.env.REDIS_URL, {
     tls: isProduction ? { rejectUnauthorized: false } : undefined,
     connectTimeout: 10000,
     retryStrategy: (times) => Math.min(times * 200, 3000),
   });
   ```

3. Make the Redis client available to the Express app:
   ```javascript
   app.set("redisClient", redisClient);
   ```

After implementing these fixes, the backend should work correctly on Vercel with proper Redis and MongoDB connections.

## Known Limitations

- Long-running processes like the Redis stream consumer may not work well in a serverless environment
- You might need to consider separating your frontend and backend deployments
- For production, consider using a proper message queue system instead of Redis streams

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
