import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

export function initPassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email: profile.emails[0].value,
              avatar: profile.photos[0].value,
            });
          }
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    // For guest users, serialize the entire user object
    if (user.isGuest) {
      return done(null, {
        isGuest: true,
        _id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      });
    }
    // For regular users, serialize just the ID
    done(null, user.id);
  });

  passport.deserializeUser(async (serialized, done) => {
    try {
      // Check if this is a guest user (serialized will be the full object)
      if (serialized && typeof serialized === "object" && serialized.isGuest) {
        return done(null, serialized);
      }

      // Otherwise, it's a regular user ID
      const user = await User.findById(serialized);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
}
