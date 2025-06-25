# 🚀 CRMspace Platform

A full-featured CRM platform for customer segmentation, campaign management, and AI-powered insights.

---

## 🧩 Overview

This CRM platform enables:

- **Customer segmentation** using flexible rule logic
- **Personalized campaign delivery** through simulated messaging
- **AI-powered insights** to convert plain text into audience filters and summarize campaign stats
- **Guest User Access** for quick platform exploration without Google authentication

---

## 🛠️ Tech Stack

- **Frontend:** React.js with Vite + Tailwind CSS + Framer Motion
- **Backend:** Node.js + Express (ES6 modules)
- **Database:** MongoDB (Mongoose)
- **Message Broker:** Redis Streams (pub/sub)
- **Authentication:** Google OAuth 2.0 (Passport.js) + Guest Access
- **AI Services:** OpenAI for text generation, Neblius AI for image generation
- **Session Management:** Redis + Custom Memory Session Store

---

## Demo Video Link

```bash
https://youtu.be/x__81ZHFtvc
```

---

## 🗃 Project Structure

```
/crmspace/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   │   └── memorySessionStore.js  # Custom session handling
│   │   ├── redis/
│   │   ├── ai/
│   │   └── app.js
│   ├── mock-data/
│   ├── package.json
│   └── swagger.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/          # Reusable UI components
│   │   ├── pages/
│   │   ├── services/
│   │   ├── contexts/
│   └── package.json
└── README.md
```

---

## ⚙️ Local Setup Instructions

### Prerequisites

1. **Node.js and npm**

   ```bash
   # Check if installed
   node -v
   npm -v

   # Install if needed (Ubuntu/Debian)
   sudo apt update
   sudo apt install nodejs npm
   ```

2. **MongoDB**

   ```bash
   # Install MongoDB (Ubuntu/Debian)
   sudo apt update
   sudo apt install mongodb
   sudo systemctl start mongodb
   sudo systemctl enable mongodb

   # Install MongoDB Compass (GUI)
   # For Ubuntu/Debian
   wget https://downloads.mongodb.com/compass/mongodb-compass_1.35.0_amd64.deb
   sudo dpkg -i mongodb-compass_1.35.0_amd64.deb

   # For other systems, download from:
   # https://www.mongodb.com/products/compass
   ```

   **Important Note:** The application connects to the `crm` database in MongoDB, not `crmspace`. When viewing data in MongoDB Compass, make sure to check the `crm` database, not `crmspace`.

3. **Redis**

   ```bash
   # Install Redis (Ubuntu/Debian)
   sudo apt update
   sudo apt install redis-server
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```

4. **Environment Variables**

   Create `.env` files in both backend and frontend directories:

   Backend `.env`:

   ```
   PORT=5003
   REDIS_HOST=localhost
   REDIS_PORT=6379
   USE_REDIS=true
   MONGODB_URI=mongodb://localhost:27017/crm
   REDIS_URL=redis://localhost:6379
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_session_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

   Frontend `.env`:

   ```
   VITE_API_URL=http://localhost:5003
   ```

### Setup Steps

1. **Clone the Repository**

   ```bash
   git clone <repo-url> crmspace
   cd crmspace
   ```

2. **Install Root Dependencies**

   ```bash
   npm install
   ```

3. **Backend Setup**

   ```bash
   cd backend
   npm install
   ```

4. **Frontend Setup**

   ```bash
   cd ../frontend
   npm install
   ```

5. **Database Setup**
   ```bash
   # Import mock data into MongoDB
   node backend/importMockData.js
   ```

### Running the Application

1. **Start Backend & Frontend**

   ```bash
   cd fresh-crmspace
   npm start
   ```

   This will concurrently start:

   - Backend server on port 5003
   - Frontend development server on port 5173

2. **Individual Component Start**

   ```bash
   # Backend only
   cd backend
   npm run dev

   # Frontend only
   cd frontend
   npm run dev

   # Stream consumer only (IMPORTANT!)
   cd backend
   npm run consumer
   ```

   **IMPORTANT:** The Redis stream consumer must be running for data to flow from Redis to MongoDB. If you're adding customers or orders and they're not appearing in MongoDB, make sure the stream consumer is running.

3. **Development with Both API and Stream Consumer**

   ```bash
   # Run both backend API and stream consumer
   cd backend
   npm run dev:full
   ```

4. **Reset Data**

   ```bash
   # Reset all (MongoDB data and Redis streams)
   cd backend
   npm run reset:all

   # Reset only Redis streams
   cd backend
   npm run reset:redis
   ```

5. **Troubleshooting: Port in Use**

   ```bash
   # Find process using port 5003
   lsof -i :5003

   # Kill the process
   kill -9 <PID>
   ```

6. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5003
   - API Documentation: http://localhost:5003/api-docs (if Swagger is configured)

---

## 🔄 Complete Walkthrough of CRMspace Platform

### Step 1. User Authentication

There are two ways to access the platform:

#### Option A: Google OAuth 2.0

- User visits the CRM platform and logs in with Google
- Backend uses Passport.js with GoogleStrategy
- After authentication, JWT is created and used for protected routes
- Frontend AuthContext verifies authentication via /auth/me endpoint

#### Option B: Guest Access

- Click "Continue as Guest" on the login page
- A temporary guest account is created with limited functionality
- Guest sessions are managed through a custom memory session store
- Guest users can explore basic features without Google authentication

### Step 2. Customer Data Ingestion with Redis Streams

- Admin/Developer prepares customer data using example from `/backend/mock-data/customers.json`
- Uses Postman to make POST request to `http://localhost:5003/api/customers`
- Includes authentication cookie in request headers:
  ```
  Cookie: connect.sid=s%3As62nMnMOWFD2ohr0Szfs7TrjCMjS4roZ.K5ISzXavJXqnnEU9DptwoRFtFAp5N34d%2BiiUgT0igac
  ```
  (Get the cookie value from your browser's storage/cookies after logging in)
- Formats customer data (name, email, spend, etc.) as JSON in request body
- Backend ingestCustomer controller receives the request
- requireAuth middleware verifies user is authenticated
- Validates required fields (name and email)
- Formats data for Redis stream
- Controller publishes to "customer_ingest" Redis stream
- Stream consumer processes data asynchronously
- Customer documents are created in MongoDB `crm` database

### Step 3. Order Data Ingestion with Redis Streams

- Similar to customer ingestion, prepare order data from `/backend/mock-data/orders.json`
- Uses Postman to make POST request to `http://localhost:5003/api/orders`
- Includes the same authentication cookie as in Step 2
- Formats order data (customerId, orderAmount) as JSON in request body
- Backend ingestOrder controller processes request
- Validates required fields (customerId, orderAmount)
- Formats data for Redis stream
- Controller publishes to "order_ingest" Redis stream
- Stream consumer processes the order asynchronously
- Creates Order document in MongoDB `crm` database
- Updates customer spending information

### Step 4. Segment Management

- User creates segment rules (manually or with AI assistance)
- Preview audience shows matching customers
- Saved segments are stored in MongoDB with audience metrics

### Step 5. Campaign Creation with AI Assistance

- User selects target segment for campaign
- AI generates message text and campaign image
- User finalizes and submits campaign
- Frontend sends complete campaign data to POST `/api/campaigns`
- Backend campaign processing flow:
  1. createCampaign controller validates segment and message
  2. Processes AI-generated image data and saves to filesystem
  3. Creates campaign record in MongoDB
  4. Makes internal request to deliveryreceipt endpoint (with authentication cookies)
  5. handleCampaignDelivery controller initiates delivery process:
     - Creates master log entry in communication logs
     - Retrieves segment definition and builds MongoDB query
     - Finds matching audience (target customers)
     - Creates individual communication logs for each recipient
     - Simulates delivery with realistic success rates (90% success, 10% failure)
     - Returns comprehensive statistics to frontend
  6. Frontend displays success message and updates campaign list

### Step 6. Campaign Monitoring and Analytics

- User views campaign list and details
- User clicks "Show Details" on a campaign card
- Frontend makes parallel requests for campaign stats and logs
- Backend getCampaignStats controller returns delivery metrics
- Backend listCommunicationLogs controller returns detailed delivery information
- Frontend renders statistics panel and log table
- User clicks "Summarize Campaign" for AI insights
- AI generates natural language performance summary
- Frontend displays AI insights in campaign card

---

## 🔧 Troubleshooting Guide

### Common Issues and Solutions

1. **Session Issues**

   - Clear browser cookies and local storage
   - Ensure Redis server is running
   - Check session secret in environment variables

2. **MongoDB Connection Issues**

   - Verify MongoDB service is running: `sudo systemctl status mongodb`
   - Check MongoDB connection string in `.env`
   - Ensure `crm` database exists

3. **Redis Stream Consumer Not Processing**

   - Verify Redis server is running: `sudo systemctl status redis-server`
   - Check if consumer process is active: `ps aux | grep consumer`
   - Restart consumer: `cd backend && npm run consumer`

4. **Guest User Access Issues**
   - Check if memory session store is properly initialized
   - Verify guest user routes are properly configured
   - Clear browser cache and try again

### Development Tips

1. **Debugging Tools**

   - Use MongoDB Compass to inspect database
   - Redis Commander for Redis inspection: `npm install -g redis-commander`
   - React Developer Tools for frontend debugging

2. **Testing**

   - Use Postman collections in `/backend/postman`
   - Test guest user flows separately from authenticated flows
   - Monitor Redis streams using Redis CLI: `redis-cli monitor`

3. **Performance Optimization**
   - Keep Redis stream consumer running
   - Monitor memory usage for guest sessions
   - Use browser dev tools Network tab to check API response times

---

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## Segment Preview Fix

The segment preview functionality was not working correctly. The following issues were identified and fixed:

1. **Data Issue**: Only one customer was loaded in MongoDB instead of all the customers from the mock data file.

   - Added an `importMockData.js` script to properly import all mock data into MongoDB.

2. **Backend Improvements**:

   - Enhanced the `buildQueryFromRules` function to better handle edge cases and provide detailed logging.
   - Added support for "contains" operator for string fields.
   - Added better error handling and logging throughout the segment controller.
   - Created a test endpoint that doesn't require authentication for easier debugging.

3. **Frontend Improvements**:
   - Added loading state for the preview button.
   - Improved error handling with more descriptive messages.
   - Added an "Add Example" button to help users create valid segment rules.
   - Added validation for the rules JSON format.
   - Updated to use the test endpoint for easier development.

## Testing the Fix

1. First, import the mock data:

   ```bash
   node backend/importMockData.js
   ```

2. Start the backend:

   ```bash
   cd backend && npm start
   ```

3. Start the frontend:

   ```bash
   cd frontend && npm run dev
   ```

4. Visit the Segments page and try the preview functionality with different rules.

## Animated UI Components

The CRM application has been enhanced with a suite of animated UI components built using Framer Motion for a more engaging user experience:

### Animation Components

- **FadeIn**: Creates smooth fade-in animations with optional staggered children.
- **ScrollReveal**: Reveals elements with animation as they enter the viewport.
- **Tooltip**: Provides informative tooltips with smooth animations.

### Form Components

- **AnimatedInput**: Enhanced text input with floating label animations.
- **AnimatedTextarea**: Enhanced textarea with floating label animations.
- **AnimatedSelect**: Enhanced select dropdown with floating label and chevron animations.

### UI Components

- **AnimatedButton**: Buttons with hover and tap animations.
- **AnimatedCard**: Cards with entrance and hover animations.

### Usage Example

```jsx
import {
  FadeIn,
  AnimatedButton,
  AnimatedCard,
  AnimatedInput,
} from "./components/ui";

function MyComponent() {
  return (
    <FadeIn className="space-y-4" staggerItems>
      <AnimatedInput
        label="Email"
        type="email"
        placeholder="Enter your email"
      />

      <AnimatedCard>
        <div className="p-4">Card content here</div>
      </AnimatedCard>

      <AnimatedButton>Click Me</AnimatedButton>
    </FadeIn>
  );
}
```
