import express from "express";
import passport from "passport";

const router = express.Router();

// Debug middleware to inspect sessions
router.use((req, res, next) => {
  console.log("Session ID:", req.sessionID || "no session id");
  console.log("Is Authenticated:", req.isAuthenticated());
  console.log("Session:", JSON.stringify(req.session, null, 2));
  console.log("User:", req.user);
  console.log("Cookies:", req.headers.cookie);
  next();
});

// Google OAuth login
router.get(
  "/google",
  (req, res, next) => {
    console.log("Starting Google OAuth flow...");
    console.log("Session before Google Auth:", req.sessionID);
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("Received Google callback");
    console.log("Session in callback:", req.sessionID);
    console.log("Callback headers:", JSON.stringify(req.headers));
    next();
  },
  (req, res, next) => {
    passport.authenticate("google", { session: true }, (err, user, info) => {
      console.log("Google auth callback processing...");

      if (err) {
        console.error("Google auth error:", err);
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/login?error=auth&message=${encodeURIComponent(err.message)}`
        );
      }

      if (!user) {
        console.log("No user returned from Google auth");
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/login?error=nouser`
        );
      }

      // Log in the authenticated user
      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.redirect(
            `${
              process.env.FRONTEND_URL || "http://localhost:5173"
            }/login?error=login&message=${encodeURIComponent(loginErr.message)}`
          );
        }

        console.log("User authenticated successfully:", user.email);
        console.log("Session after login:", req.sessionID);
        req.session.userId = user._id;
        req.session.email = user.email;

        // Force session save before redirecting
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
          }

          // Generate a stronger session token to be passed in the URL
          const sessionToken =
            req.sessionID +
            "_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substring(2, 15);

          // Store this token in the session for verification
          req.session.authToken = sessionToken;

          // Save the session again with the token
          req.session.save((err) => {
            if (err) {
              console.error("Second session save error:", err);
            }

            // Redirect to frontend after login with a success parameter and session token
            return res.redirect(
              `${
                process.env.FRONTEND_URL || "http://localhost:5173"
              }?auth=success&token=${sessionToken}`
            );
          });
        });
      });
    })(req, res, next);
  }
);

// Logout user
router.post("/logout", (req, res) => {
  console.log("Logging out user");

  if (req.isAuthenticated()) {
    console.log("User was authenticated, destroying session");
    req.logout(function (err) {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ error: "Logout failed" });
      }

      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ error: "Session destruction failed" });
        }

        res.clearCookie("connect.sid");
        res.status(200).json({ message: "Successfully logged out" });
      });
    });
  } else {
    console.log("No authenticated user to log out");
    res.status(200).json({ message: "No user to logout" });
  }
});

// Get current user
router.get("/me", (req, res) => {
  console.log("GET /auth/me endpoint called");
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("Session ID:", req.sessionID);
  console.log("User object:", req.user);

  try {
    if (!req.isAuthenticated() || !req.user) {
      console.log("User not authenticated");
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Return user data without sensitive fields
    const { password, ...userData } = req.user._doc || req.user;
    res.json(userData);
  } catch (error) {
    console.error("Error in /auth/me endpoint:", error);
    res.status(500).json({ error: error.message });
  }
});

// Verify token from URL
router.post("/verify-token", (req, res) => {
  const { token } = req.body;

  console.log("Verifying token:", token);
  console.log("Current session:", req.sessionID);
  console.log("Session data:", req.session);

  if (!token) {
    return res.status(400).json({ error: "No token provided" });
  }

  // If user is already authenticated, we're good
  if (req.isAuthenticated()) {
    console.log("User already authenticated");
    const { password, ...userData } = req.user._doc || req.user;
    return res.json({ success: true, user: userData });
  }

  // If we have a token in the session and it matches
  if (req.session.authToken && req.session.authToken === token) {
    console.log("Token verification successful");

    // If we have user data in session but user is not authenticated yet
    if (req.session.userId) {
      console.log("We have user ID in session, restoring authentication");

      // Return the authentication success response
      return res.json({
        success: true,
        message: "Token verified",
        sessionId: req.sessionID,
      });
    }
  }

  console.log("Token verification failed");
  return res.status(401).json({ error: "Invalid or expired token" });
});

export default router;
