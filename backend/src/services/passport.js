import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

export function initPassport() {
  // Log configuration for debugging
  console.log("Initializing Passport with callback URL:", GOOGLE_CALLBACK_URL);

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.error(
      "Missing Google OAuth credentials! Authentication will fail."
    );
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        proxy: true, // Important for handling proxies like Vercel
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log(
            "Google auth callback received for user:",
            profile.displayName
          );

          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            console.log("Creating new user:", profile.displayName);
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos[0].value,
            });
            console.log("New user created:", user.email);
          } else {
            console.log("Existing user found:", user.email);
          }
          return done(null, user);
        } catch (err) {
          console.error("Error in Google auth callback:", err);
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log("Serializing user:", user.email);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      if (!user) {
        console.warn("User not found during deserialization, id:", id);
        return done(null, false);
      }
      console.log("Deserialized user:", user.email);
      done(null, user);
    } catch (err) {
      console.error("Error deserializing user:", err);
      done(err, null);
    }
  });
}
