# 🚀 CRMspace Platform

A full-featured CRM platform for customer segmentation, campaign management, and AI-powered insights.

---

## 🧩 Overview

This CRM platform enables:

- **Customer segmentation** using flexible rule logic
- **Personalized campaign delivery** through simulated messaging
- **AI-powered insights** to convert plain text into audience filters and summarize campaign stats

---

## 🛠️ Tech Stack

- **Frontend:** React.js with Vite + Tailwind CSS
- **Backend:** Node.js + Express (ES6 modules)
- **Database:** MongoDB (Mongoose)
- **Message Broker:** Redis Streams (pub/sub)
- **Authentication:** Google OAuth 2.0 (Passport.js)
- **AI Services:** OpenAI for text generation, Neblius AI for image generation

---

##  Demo Video

```https://youtu.be/x__81ZHFtvc```

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
│   │   ├── redis/
│   │   ├── ai/
│   │   └── app.js
│   ├── mock-data/
│   ├── package.json
│   └── swagger.json
├── frontend/
│   ├── src/
│   │   ├── components/
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

1. **Start All Services (Backend, Frontend, Stream Consumer)**

   ```bash
   npm start
   ```

   This will concurrently start:

   - Backend server on port 5003
   - Frontend development server on port 5173
   - Redis stream consumer

2. **Individual Component Start**

   ```bash
   # Backend only
   cd backend
   npm run dev

   # Frontend only
   cd frontend
   npm run dev

   # Stream consumer only
   node backend/src/service/consumerstream.js
   ```

3. **Reset Data**

   ```bash
   # Reset all (MongoDB data and Redis streams)
   npm run reset:all

   # Reset only Redis streams
   npm run reset:redis
   ```

4. **Troubleshooting: Port in Use**

   ```bash
   # Find process using port 5003
   lsof -i :5003

   # Kill the process
   kill -9 <PID>
   ```

5. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5003
   - API Documentation: http://localhost:5003/api-docs (if Swagger is configured)

---

## 🔄 Complete Walkthrough of CRMspace Platform

### Step 1. User Authentication with Google OAuth 2.0

- User visits the CRM platform and logs in with Google
- Backend uses Passport.js with GoogleStrategy
- After authentication, JWT is created and used for protected routes
- Frontend AuthContext verifies authentication via /auth/me endpoint

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

## 🖼️ Architecture Diagram

See the architecture diagram saved in the project.

---

## 🤖 AI Tools and Technology Used

- **OpenAI**: Used for:
  - Campaign message generation
  - Segment rule building from natural language
  - Campaign performance summaries
- **Neblius AI**: Used for:
  - Campaign image generation with marketing-optimized dimensions
- **Other Key Technologies**:
  - Redis Streams for asynchronous processing
  - MongoDB for data storage
  - React with Vite for frontend
  - Express.js for backend API
  - Tailwind CSS for styling

---

## ⚠️ Known Limitations and Assumptions

1. **Database Connectivity**:

   - The application connects to the `crm` database in MongoDB, not `crmspace`
   - When viewing data in MongoDB Compass, all collections will be in the `crm` database
   - Ensure data is imported to the correct database via importMockData.js

2. **Segment Preview**:

   - The "Show Details" button must be clicked before "Summarize Campaign"
   - This is because summary generation depends on loaded campaign stats and logs

3. **CORS Handling**:

   - Cross-origin requests with credentials require proper CORS configuration
   - Backend must include appropriate headers for frontend requests

4. **Authentication**:

   - Google OAuth credentials must be configured correctly
   - HTTP-only cookies are used for session management
   - For Postman requests, you must include the session cookie from your browser

5. **Redis Dependency**:

   - Redis must be running for the stream consumer to function
   - Data processing is asynchronous, relying on Redis Streams

6. **AI Service Dependencies**:
   - OpenAI and Neblius AI services require valid API keys
   - AI features will not work without proper configuration

---

## 📄 License

MIT

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
