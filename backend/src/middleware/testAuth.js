// Testing middleware that bypasses authentication checks
// WARNING: Only use this for testing purposes!

export function bypassAuth(req, res, next) {
  // Add a mock user to the request
  req.user = {
    _id: "12345",
    email: "test@example.com",
    name: "Test User",
  };

  // Make req.isAuthenticated() return true
  req.isAuthenticated = () => true;

  return next();
}
