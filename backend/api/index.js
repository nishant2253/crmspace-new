// This file is used as an entry point for Vercel serverless functions

import "../src/server.js";

// Export a default function for Vercel
export default function handler(req, res) {
  // This function will never be called directly because the server.js
  // file handles all requests, but Vercel requires an export
  res.status(200).json({ message: "Server is running" });
}
