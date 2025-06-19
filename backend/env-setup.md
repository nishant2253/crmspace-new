# Environment Variables Setup Guide

## Required Environment Variables

For the application to work correctly, you need to set up the following environment variables in your Vercel deployment:

### MongoDB Configuration

- `MONGO_URI`: Your MongoDB connection string (e.g., `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority`)

### Session Configuration

- `SESSION_SECRET`: A secure random string for session encryption

### Google OAuth Configuration

- `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
- `GOOGLE_CALLBACK_URL`: The callback URL for Google OAuth (e.g., `https://crmspace2253.vercel.app/auth/google/callback`)

### Frontend URL

- `FRONTEND_URL`: The URL of your frontend (e.g., `https://crmspacefrontend.vercel.app`)

### Redis Configuration (optional)

- `REDIS_URL`: Your Redis connection string (if using Redis)

## Setting Up in Vercel

1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add each of the variables listed above
4. Deploy your project again to apply the changes

## Local Development

For local development, create a `.env` file in the backend directory with the same variables.

## Troubleshooting

If you're experiencing MongoDB connection issues:

- Verify your MongoDB Atlas cluster is running
- Check that your IP address is whitelisted in MongoDB Atlas
- Ensure your MongoDB user has the correct permissions
- Verify the connection string format is correct
