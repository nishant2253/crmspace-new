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
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    // Ensure cookies are properly set before redirecting
    res.header("Access-Control-Allow-Credentials", "true");
    const origin = process.env.FRONTEND_URL || "http://localhost:5173";
    res.header("Access-Control-Allow-Origin", origin);

    // Log the user info for debugging
    console.log("User authenticated:", req.user?.email);

    // Redirect to frontend
    res.redirect(origin);
  }
);

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  });
});

// Get current user
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: "Not authenticated" });
  }
});

// Test authentication endpoint
router.get("/test-auth", (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user
      ? {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
        }
      : null,
    sessionID: req.sessionID,
    cookies: req.headers.cookie,
  });
});

export default router;
