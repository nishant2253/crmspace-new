# Deployment Instructions for CRMSpace

## Backend Deployment (Vercel)

1. **Set up environment variables in Vercel:**

   - `MONGO_URI`: Your MongoDB connection string
   - `SESSION_SECRET`: A secure random string for session encryption
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
   - `GOOGLE_CALLBACK_URL`: `https://crmspace2253.vercel.app/auth/google/callback`
   - `FRONTEND_URL`: `https://crmspacefrontend.vercel.app`
   - `USE_SIMPLE_APP`: `true` (to use the simplified app version without optional dependencies)
   - `NODE_ENV`: `production`

2. **Deploy the backend to Vercel:**

   ```
   cd backend
   vercel
   ```

3. **Verify the backend deployment:**
   - Visit `https://crmspace2253.vercel.app/test`
   - You should see a message: `{"message":"Test route working!"}`

## Frontend Deployment (Vercel)

1. **Set up environment variables in Vercel:**

   - `VITE_API_URL`: `https://crmspace2253.vercel.app`

2. **Deploy the frontend to Vercel:**

   ```
   cd frontend
   vercel
   ```

3. **Verify the frontend deployment:**
   - Visit `https://crmspacefrontend.vercel.app`
   - You should see the login page

## Troubleshooting

If you encounter issues with the deployment, try the following:

1. **Check the backend logs in Vercel:**

   - Look for any error messages related to missing dependencies
   - Verify that all environment variables are set correctly

2. **Test the authentication flow:**

   - Visit `https://crmspacefrontend.vercel.app/debug`
   - Use the debug tools to check the database status and authentication status

3. **Common issues:**
   - **MongoDB connection errors:** Verify your MongoDB URI and ensure your IP is whitelisted
   - **Authentication errors:** Check your Google OAuth credentials and callback URL
   - **CORS errors:** Verify that the frontend URL is correctly set in the backend

## Required Dependencies

The following dependencies are required for the application to work correctly:

- Backend:

  - `connect-mongo`: For session storage
  - `express-session`: For session management
  - `passport`: For authentication
  - `passport-google-oauth20`: For Google OAuth authentication
  - `mongoose`: For MongoDB connection
  - `express`: For the web server
  - `cors`: For CORS support

- Frontend:
  - `axios`: For API requests
  - `react-router-dom`: For routing
  - `tailwindcss`: For styling
