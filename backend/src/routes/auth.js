import express from "express";
import passport from "passport";

const router = express.Router();

// Google OAuth login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.FRONTEND_URL || "http://localhost:5173",
    session: true,
  }),
  (req, res) => {
    // Log successful authentication
    console.log("Google authentication successful for user:", req.user.email);

    // Make sure session is saved before redirecting
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
      }
      // Redirect to frontend after login
      res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
    });
  }
);

// Guest login - creates a guest user session
router.get("/guest", (req, res) => {
  try {
    // Create a simplified guest user object with timestamp
    const timestamp = Date.now();
    const guestUser = {
      _id: `guest-${timestamp}`,
      email: `guest@example.com`,
      name: "Guest User",
      isGuest: true,
      picture: "https://ui-avatars.com/api/?name=Guest+User&background=random",
    };

    // Set user in session directly
    req.session.passport = { user: guestUser };

    // Return success immediately without saving session
    res.status(200).json({ success: true, user: guestUser });
  } catch (error) {
    console.error("Guest login error:", error);
    res.status(500).json({ error: "Failed to login as guest" });
  }
});

// Logout
router.get("/logout", (req, res) => {
  // Check if the request is an API call (has Accept: application/json header)
  const isApiRequest =
    req.get("Accept")?.includes("application/json") ||
    req.xhr ||
    req.get("Content-Type")?.includes("application/json");

  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      if (isApiRequest) {
        return res.status(500).json({ error: "Logout failed" });
      }
    }

    // For API requests, return JSON
    if (isApiRequest) {
      return res.json({ success: true });
    }

    // For browser requests, redirect
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  });
});

// Get current user
router.get("/me", (req, res) => {
  // Remove excessive logging
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;
