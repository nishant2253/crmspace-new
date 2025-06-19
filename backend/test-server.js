// Test script to verify server setup
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

console.log("=== Testing Server Configuration ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("USE_SIMPLE_APP:", process.env.USE_SIMPLE_APP);

// Try to load the app modules
async function testAppModules() {
  try {
    console.log("\nTesting app.js import...");
    const app = await import("./src/app.js");
    console.log("✅ app.js imported successfully");
  } catch (error) {
    console.error("❌ Error importing app.js:", error.message);
  }

  try {
    console.log("\nTesting app-simple.js import...");
    const appSimple = await import("./src/app-simple.js");
    console.log("✅ app-simple.js imported successfully");
  } catch (error) {
    console.error("❌ Error importing app-simple.js:", error.message);
  }

  try {
    console.log("\nTesting server.js import...");
    const server = await import("./src/server.js");
    console.log("✅ server.js imported successfully");
  } catch (error) {
    console.error("❌ Error importing server.js:", error.message);
  }
}

// Test dependencies
async function testDependencies() {
  console.log("\n=== Testing Dependencies ===");

  const dependencies = [
    "express",
    "mongoose",
    "passport",
    "express-session",
    "connect-mongo",
  ];

  for (const dep of dependencies) {
    try {
      const module = await import(dep);
      console.log(`✅ ${dep} imported successfully`);
    } catch (error) {
      console.error(`❌ Error importing ${dep}:`, error.message);
    }
  }
}

// Run tests
async function runTests() {
  await testAppModules();
  await testDependencies();

  console.log("\n=== Test Complete ===");
}

runTests().catch(console.error);
