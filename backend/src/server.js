import dotenv from "dotenv";
import http from "http";

// Load environment variables
dotenv.config();

// Determine which app version to use
let app;

try {
  if (process.env.USE_SIMPLE_APP === "true") {
    console.log("Using simple app version without connect-mongo");
    app = (await import("./app-simple.js")).default;
  } else {
    console.log("Using standard app version");
    app = (await import("./app.js")).default;
  }
} catch (error) {
  console.error("Error importing app:", error);
  console.log("Falling back to simple app version");

  try {
    app = (await import("./app-simple.js")).default;
  } catch (fallbackError) {
    console.error(
      "Critical error, could not load any app version:",
      fallbackError
    );
    process.exit(1);
  }
}

// Get port from environment or use default
const port = process.env.PORT || 3001;
app.set("port", port);

// Create HTTP server
const server = http.createServer(app);

// Listen on provided port
server.listen(port);

// Event listeners
server.on("error", (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
});

server.on("listening", () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Server listening on " + bind);
});
