# CRM Backend

This is the backend server for the CRM application.

## Prerequisites

- Node.js (v18+)
- MongoDB
- Redis

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file based on the example:
   ```
   MONGO_URI=mongodb://localhost:27017/crm
   REDIS_HOST=localhost
   REDIS_PORT=6379
   USE_REDIS=true
   SESSION_SECRET=your_session_secret
   PORT=5003
   ```

## Running the Application

### Development Mode

To run both the API server and the stream consumer:

```
npm run dev:full
```

To run only the API server:

```
npm run dev
```

To run only the stream consumer:

```
npm run consumer
```

### Production Mode

To run both the API server and the stream consumer:

```
npm run start:full
```

To run only the API server:

```
npm start
```

## Important Note

The Redis stream consumer must be running for data to be processed from Redis streams to MongoDB. If you're adding customers or orders through the API and they're not appearing in MongoDB, make sure the stream consumer is running.

## Utilities

- Reset the database: `npm run reset:db`
- Reset Redis streams: `npm run reset:redis`
- Reset Redis consumer groups: `npm run reset:consumer-groups`
- Reset everything: `npm run reset:all`
