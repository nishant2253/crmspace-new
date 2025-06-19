import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

// Initialize passport with Google OAuth strategy
export const initPassport = () => {
  // Configure serialization/deserialization
  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    console.log("Deserializing user:", id);
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      console.error("Error deserializing user:", err);
      done(err, null);
    }
  });

  // Get environment variables
  const googleClientID = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

  // Determine callback URL based on environment
  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://crmspace2253.vercel.app/auth/google/callback"
      : "http://localhost:3001/auth/google/callback");

  console.log("Google OAuth configuration:");
  console.log("- Client ID configured:", !!googleClientID);
  console.log("- Client Secret configured:", !!googleClientSecret);
  console.log("- Callback URL:", callbackURL);
  console.log("- Frontend URL:", frontendURL);

  // Configure Google strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientID,
        clientSecret: googleClientSecret,
        callbackURL: callbackURL,
        proxy: true, // Trust proxy - important for Vercel
        passReqToCallback: true, // Pass request to callback
      },
      async (req, accessToken, refreshToken, profile, done) => {
        console.log(
          "Google auth callback received for user:",
          profile.displayName
        );

        try {
          // Check if user exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            console.log("Existing user found:", user.email);
            return done(null, user);
          }

          // Create new user
          console.log("Creating new user for:", profile.displayName);
          user = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            role: "user",
          });

          await user.save();
          console.log("New user created:", user.email);
          return done(null, user);
        } catch (err) {
          console.error("Error in Google auth callback:", err);
          return done(err, null);
        }
      }
    )
  );
};
