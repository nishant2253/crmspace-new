import mongoose from "mongoose";
import User from "../models/User.js";

export function requireAuth(req, res, next) {
  // Check standard authentication first
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  // Check if we have session data even if passport doesn't think we're authenticated
  if (req.session && req.session.userId) {
    console.log("Found session with userId but not authenticated by passport");

    // Try to restore the user from session
    const userId = req.session.userId;

    // Validate the userId format
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ error: "Invalid session user ID" });
    }

    // Find the user in the database
    User.findById(userId)
      .then((user) => {
        if (!user) {
          return res.status(401).json({ error: "User not found" });
        }

        // Manually set up the user in the request
        req.user = user;
        req.logIn(user, (err) => {
          if (err) {
            console.error("Failed to log in user from session:", err);
          } else {
            console.log(
              "Successfully restored user authentication from session"
            );
          }
          next();
        });
      })
      .catch((err) => {
        console.error("Error finding user from session:", err);
        return res.status(401).json({ error: "Authentication required" });
      });
    return;
  }

  // Check for Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];

    // Verify token - in a real app, use JWT verification here
    // This is just a simple check for the session token we set earlier
    if (req.session && req.session.authToken === token) {
      return next();
    }
  }

  return res.status(401).json({ error: "Authentication required" });
}
