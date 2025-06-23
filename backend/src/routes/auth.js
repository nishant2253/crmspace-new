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
  // Create a guest user object
  const guestUser = {
    _id: "guest-user",
    email: "guest@example.com",
    name: "Guest User",
    isGuest: true,
    picture: "https://ui-avatars.com/api/?name=Guest+User&background=random",
  };

  // Log in the guest user
  req.login(guestUser, (err) => {
    if (err) {
      console.error("Guest login error:", err);
      return res.status(500).json({ error: "Failed to login as guest" });
    }

    // Save the session
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
      }
      console.log("Guest user logged in successfully");
      // Redirect to frontend
      res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
    });
  });
});

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  });
});

// Get current user
router.get("/me", (req, res) => {
  console.log("Session ID:", req.sessionID);
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("Session:", req.session);

  if (req.isAuthenticated()) {
    console.log("Authenticated user:", req.user.email);
    res.json(req.user);
  } else {
    console.log("User not authenticated");
    res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;
