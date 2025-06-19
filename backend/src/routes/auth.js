import express from "express";
import passport from "passport";

const router = express.Router();

// Google OAuth login
router.get(
  "/google",
  (req, res, next) => {
    console.log("Starting Google OAuth flow...");
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("Received Google callback");
    next();
  },
  (req, res, next) => {
    passport.authenticate("google", (err, user, info) => {
      console.log("Google auth callback processing...");

      if (err) {
        console.error("Google auth error:", err);
        return res.redirect(
          `${
            process.env.FRONTEND_URL || "http://localhost:5173"
          }/login?error=auth`
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
            }/login?error=login`
          );
        }

        console.log("User authenticated successfully:", user.email);
        // Redirect to frontend after login
        return res.redirect(
          process.env.FRONTEND_URL || "http://localhost:5173"
        );
      });
    })(req, res, next);
  }
);

// Logout
router.get("/logout", (req, res) => {
  const email = req.user?.email;
  req.logout(() => {
    console.log(`User logged out: ${email}`);
    res.redirect(process.env.FRONTEND_URL || "http://localhost:5173");
  });
});

// Get current user
router.get("/me", (req, res) => {
  if (req.isAuthenticated()) {
    console.log("Authenticated user request:", req.user.email);
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    });
  } else {
    console.log("Unauthenticated user request");
    res.status(401).json({ error: "Not authenticated" });
  }
});

export default router;
