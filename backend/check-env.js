// Add Redis URL check
function checkRedisConfig() {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.warn(
      "⚠️  Missing Redis configuration. Please set either REDIS_URL or REDIS_HOST/PORT in your .env file"
    );
    return false;
  }
  return true;
}

// Include Redis check in the main function
