export function requireAuth(req, res, next) {
  // Fast path: check if session has passport user
  if (req.session && req.session.passport && req.session.passport.user) {
    // Set a flag to indicate if this is a guest user
    req.isGuestUser = req.session.passport.user.isGuest === true;
    return next();
  }

  // Fallback to standard isAuthenticated check
  if (req.isAuthenticated && req.isAuthenticated()) {
    // Set a flag to indicate if this is a guest user
    req.isGuestUser = req.user && req.user.isGuest === true;
    return next();
  }

  return res.status(401).json({ error: "Authentication required" });
}
