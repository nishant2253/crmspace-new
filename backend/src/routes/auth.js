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
  (req, res, next) => {
    console.log("Google OAuth callback received");
    // Add CORS headers for the callback
    res.header(
      "Access-Control-Allow-Origin",
      process.env.FRONTEND_URL || "http://localhost:5173"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    next();
  },
  passport.authenticate("google", {
    failureRedirect: "/auth/login-failed",
    session: true,
  }),
  (req, res) => {
    console.log("Google authentication successful");
    console.log("User:", req.user?.email);
    console.log("Session ID:", req.sessionID);

    // Get the frontend URL from environment or use default
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    console.log("Redirecting to frontend:", frontendURL);

    // Redirect to the frontend
    res.redirect(frontendURL);
  }
);

// Login failed route
router.get("/login-failed", (req, res) => {
  console.log("Login failed");

  // Get the frontend URL from environment or use default
  const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";

  // Redirect to the frontend with error parameter
  res.redirect(`${frontendURL}?auth_error=true`);
});

// Logout
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  });
});

// Get current user
router.get("/me", (req, res) => {
  console.log("Auth /me endpoint called");
  console.log("Is authenticated:", req.isAuthenticated());
  console.log("Session ID:", req.sessionID);
  console.log("Session:", req.session);
  console.log("Cookies:", req.headers.cookie);

  if (req.isAuthenticated()) {
    console.log("User is authenticated, returning user data");
    return res.json({
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
    });
  } else {
    console.log("User is not authenticated, returning 401");
    return res.status(401).json({ error: "Not authenticated" });
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
