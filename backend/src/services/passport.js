import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

export function initPassport() {
  // Log OAuth configuration (without exposing secrets)
  console.log("Initializing Passport with:");
  console.log(
    "- Google Client ID:",
    GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 5)}...` : "missing"
  );
  console.log("- Google Callback URL:", GOOGLE_CALLBACK_URL || "missing");

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_CALLBACK_URL) {
    console.error("WARNING: Missing Google OAuth environment variables!");
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        proxy: true, // Important for Vercel deployments behind proxies
        passReqToCallback: true, // Pass request to callback for additional context
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          console.log(
            "Google profile received:",
            profile.id,
            profile.displayName
          );
          console.log("Session ID in OAuth callback:", req.sessionID);

          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            console.log("Creating new user for Google ID:", profile.id);

            // Make sure profile has the expected properties
            if (!profile.emails || !profile.emails.length) {
              return done(new Error("No email provided by Google"), null);
            }

            if (!profile.photos || !profile.photos.length) {
              console.log("No photo provided by Google, using default");
            }

            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar:
                profile.photos && profile.photos.length
                  ? profile.photos[0].value
                  : undefined,
            });
            console.log("New user created:", user._id);
          } else {
            console.log("Existing user found:", user._id);
          }
          return done(null, user);
        } catch (err) {
          console.error("Error in Google strategy:", err);
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    try {
      // For guest users, serialize the entire user object
      if (user.isGuest) {
        console.log("Serializing guest user:", user._id);
        return done(null, {
          isGuest: true,
          _id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
        });
      }
      // For regular users, serialize just the ID
      console.log("Serializing user:", user.id);
      done(null, user.id);
    } catch (err) {
      console.error("Error serializing user:", err);
      done(err, null);
    }
  });

  passport.deserializeUser(async (serialized, done) => {
    try {
      // Check if this is a guest user (serialized will be the full object)
      if (serialized && typeof serialized === "object" && serialized.isGuest) {
        console.log("Deserializing guest user:", serialized._id);
        return done(null, serialized);
      }

      // Otherwise, it's a regular user ID
      console.log("Deserializing user ID:", serialized);
      const user = await User.findById(serialized);
      if (!user) {
        console.log("User not found in database:", serialized);
        return done(new Error("User not found"), null);
      }
      done(null, user);
    } catch (err) {
      console.error("Error deserializing user:", err);
      done(err, null);
    }
  });
}
