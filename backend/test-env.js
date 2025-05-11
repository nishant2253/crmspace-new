import "dotenv/config";
console.log(process.env.OPENAI_API_KEY);

// Environment variables for testing
process.env.MONGO_URI = "mongodb://localhost:27017/crmspace";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";
process.env.PORT = "5003"; // Using 5003 to avoid conflicts
process.env.SESSION_SECRET = "testsecret123456";
