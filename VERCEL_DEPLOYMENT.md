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

## Recent Configuration Changes

### vercel.json Updates

We simplified the Vercel configuration to use a single route handler for all paths:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/app.js",
      "use": "@vercel/node",
      "config": {
        "maxDuration": 30
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/app.js",
      "headers": {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
        "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
      }
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

This configuration:

- Routes all requests to app.js
- Sets up CORS headers for all routes
- Ensures proper handling of authentication headers

### app.js Updates

Several changes were made to improve routing and debugging:

1. **Debug Routes Added**:

```javascript
// Test routes to verify routing
app.get("/auth-test", (req, res) => {
  res.json({
    message: "Auth test route working",
    session: !!req.session,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated
      ? req.isAuthenticated()
      : "function not available",
  });
});

app.get("/auth/test", (req, res) => {
  res.json({
    message: "Auth nested test route working",
    session: !!req.session,
    sessionID: req.sessionID,
    isAuthenticated: req.isAuthenticated
      ? req.isAuthenticated()
      : "function not available",
  });
});
```

2. **Debug Middleware**:

```javascript
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.path}`);
  console.log(
    `[DEBUG] Headers: ${JSON.stringify({
      origin: req.headers.origin,
      referer: req.headers.referer,
      cookie: req.headers.cookie ? "present" : "absent",
    })}`
  );
  console.log(`[DEBUG] Session: ${req.sessionID || "no session"}`);
  next();
});
```

3. **Session Configuration**:

```javascript
const sessionOptions = {
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: "none", // Always use "none" for cross-domain in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  proxy: true,
};
```

4. **404 Handler**:

```javascript
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "Not Found",
    path: req.path,
    method: req.method,
    timestamp: new Date(),
  });
});
```

## Testing the Changes

After deploying these changes, test the following endpoints:

1. `https://your-backend.vercel.app/auth-test`
2. `https://your-backend.vercel.app/auth/test`

These endpoints should return session information and help diagnose any routing issues.

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
     MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/crm?retryWrites=true&w=majority&connectTimeoutMS=30000&socketTimeoutMS=45000&maxPoolSize=10&serverSelectionTimeoutMS=15000
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

# MongoDB Connection Timeout Issues

If you encounter MongoDB connection timeout errors like:

```
MongooseError: Operation `users.findOne()` buffering timed out after 10000ms
```

Follow these steps to resolve the issue:

1. **Update MongoDB URI Format**

   Use this format for your MongoDB Atlas connection string in Vercel environment variables:

   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/crm?retryWrites=true&w=majority&connectTimeoutMS=30000&socketTimeoutMS=45000&maxPoolSize=10&serverSelectionTimeoutMS=15000
   ```

   These options optimize MongoDB connections for serverless environments:

   - `retryWrites=true`: Automatically retry write operations
   - `connectTimeoutMS=30000`: Increase connection timeout to 30 seconds
   - `socketTimeoutMS=45000`: Increase socket timeout to 45 seconds
   - `maxPoolSize=10`: Limit connection pool size for serverless functions
   - `serverSelectionTimeoutMS=15000`: Faster failure if server selection fails

2. **Verify Network Access in MongoDB Atlas**

   - Go to MongoDB Atlas dashboard
   - Navigate to Network Access
   - Add `0.0.0.0/0` to IP Access List to allow connections from anywhere
   - Or add Vercel's IP ranges if you know them

3. **Check Database User Permissions**

   - Ensure your database user has readWrite permissions
   - Verify username and password are correct in connection string

4. **Monitor Connection Status**

   - Use the `/api/diagnostic` endpoint to check MongoDB connection status
   - Look for connection errors in Vercel function logs

5. **Consider Connection Pooling**
   - For production apps with high traffic, consider using a connection pooling service like MongoDB Atlas Data API or a similar service

# Cross-Domain Authentication Issues

If you encounter authentication issues where the session exists but the user is not authenticated:

```
Auth check - isAuthenticated: false
Auth check - session exists: true
Auth check - session ID: MJ2YfSpeFNpPlWBQLIaGzwEY3tVyQHxH
Auth check - not authenticated
```

This is typically caused by cross-domain cookie issues between your frontend and backend domains. Follow these steps to resolve:

1. **Update Session Configuration**

   Ensure your session configuration in `app.js` has these settings:

   ```javascript
   const sessionOptions = {
     secret: process.env.SESSION_SECRET || "secret",
     resave: false,
     saveUninitialized: false,
     proxy: true, // Required for Vercel which uses proxies
     cookie: {
       secure: isProduction, // Use secure cookies in production
       httpOnly: true,
       sameSite: isProduction ? "none" : "lax", // Critical for cross-domain cookies
       maxAge: 24 * 60 * 60 * 1000, // 24 hours
     },
     rolling: true,
   };
   ```

2. **Configure CORS Properly**

   Ensure CORS is configured to allow credentials:

   ```javascript
   app.use(
     cors({
       origin: [
         process.env.FRONTEND_URL || "https://crmspace-frontend.vercel.app",
         "http://localhost:5173",
       ],
       credentials: true, // Critical for cookies/authentication
       methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       allowedHeaders: [
         "Content-Type",
         "Authorization",
         "X-Requested-With",
         "Accept",
       ],
       exposedHeaders: ["Set-Cookie"],
     })
   );
   ```

3. **Set Frontend Environment Variables**

   Make sure your frontend has the correct API URL:

   ```
   VITE_PROD_API_BASE_URL=https://crmspace-backend.vercel.app
   ```

4. **Configure Frontend API Client**

   Ensure your API client includes credentials:

   ```javascript
   const api = axios.create({
     baseURL: API_BASE_URL,
     withCredentials: true, // Required for cross-domain cookies
   });
   ```

5. **Enable Proxy in Passport Google Strategy**

   For Google OAuth to work with Vercel:

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

6. **Test Authentication Flow**

   - Use the browser's developer tools to check if cookies are being set
   - Look for CORS errors in the console
   - Check if the session cookie has the correct domain
   - Verify the SameSite attribute is set to "none" for cross-domain cookies

7. **Vercel-Specific Settings**

   - Ensure both frontend and backend have the same domain (e.g., vercel.app)
   - Consider using a custom domain to avoid third-party cookie restrictions
