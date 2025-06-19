import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Print environment variables (sanitized for security)
console.log("Environment variables check:");
console.log("---------------------------");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log(
  "MONGO_URI configured:",
  process.env.MONGO_URI ? "✅ Yes" : "❌ No"
);
console.log(
  "SESSION_SECRET configured:",
  process.env.SESSION_SECRET ? "✅ Yes" : "❌ No"
);
console.log(
  "GOOGLE_CLIENT_ID configured:",
  process.env.GOOGLE_CLIENT_ID ? "✅ Yes" : "❌ No"
);
console.log(
  "GOOGLE_CLIENT_SECRET configured:",
  process.env.GOOGLE_CLIENT_SECRET ? "✅ Yes" : "❌ No"
);
console.log(
  "FRONTEND_URL configured:",
  process.env.FRONTEND_URL ? "✅ Yes" : "❌ No"
);
console.log(
  "REDIS_URL configured:",
  process.env.REDIS_URL ? "✅ Yes" : "❌ No"
);
console.log("---------------------------");

// Check MongoDB URI format if it exists
if (process.env.MONGO_URI) {
  const uri = process.env.MONGO_URI;
  const isValidFormat =
    uri.startsWith("mongodb://") || uri.startsWith("mongodb+srv://");
  console.log("MONGO_URI format valid:", isValidFormat ? "✅ Yes" : "❌ No");

  // Don't print the actual URI for security, but show parts of it
  const maskedUri = uri.replace(
    /(mongodb(\+srv)?:\/\/)([^@]+)@/,
    "$1****:****@"
  );
  console.log("MONGO_URI (masked):", maskedUri);
}

// Check Google callback URL
if (process.env.GOOGLE_CALLBACK_URL) {
  console.log("GOOGLE_CALLBACK_URL:", process.env.GOOGLE_CALLBACK_URL);
} else {
  console.log("GOOGLE_CALLBACK_URL: ❌ Not configured");
}

// Check frontend URL
if (process.env.FRONTEND_URL) {
  console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
}

console.log("---------------------------");
