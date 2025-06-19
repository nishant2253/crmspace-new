import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";

export default function GetStartedPage() {
  const { user } = useAuth();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12,
      },
    },
  };

  const cardHoverVariants = {
    hover: {
      y: -5,
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
  };

  const steps = [
    {
      number: 1,
      title: "Authenticate with Google",
      description:
        "Sign in with your Google account to access the CRM platform.",
      action: user ? (
        <div className="text-green-600 font-medium">✓ Completed</div>
      ) : (
        <Link to="/login" className="text-blue-600 hover:underline font-medium">
          Go to Login
        </Link>
      ),
    },
    {
      number: 2,
      title: "Make POST Request to API/Segment",
      description:
        "Send customer data to the system using real-time data or mock data.",
      action: (
        <a
          href="#mock-data"
          className="text-blue-600 hover:underline font-medium"
        >
          Learn More
        </a>
      ),
    },
    {
      number: 3,
      title: "Navigate to Segment Page",
      description:
        "Go to the Segments page to create and manage customer segments.",
      action: user ? (
        <Link
          to="/segments"
          className="text-blue-600 hover:underline font-medium"
        >
          Go to Segments
        </Link>
      ) : (
        <span className="text-gray-500">Login Required</span>
      ),
    },
    {
      number: 4,
      title: "Write Rule Builder Prompt",
      description:
        "Use AI assistance to generate rules JSON for your desired audience.",
      action: user ? (
        <Link
          to="/segments"
          className="text-blue-600 hover:underline font-medium"
        >
          Try AI Assistant
        </Link>
      ) : (
        <span className="text-gray-500">Login Required</span>
      ),
    },
    {
      number: 5,
      title: "Check and Import Mock Data",
      description:
        "Use mock data for testing if you don't have real customer data.",
      action: (
        <a
          href="#mock-data"
          className="text-blue-600 hover:underline font-medium"
          id="mock-data"
        >
          View Mock Data
        </a>
      ),
    },
    {
      number: 6,
      title: "Preview Audience",
      description:
        "See which customers match your segment criteria before finalizing.",
      action: user ? (
        <Link
          to="/segments"
          className="text-blue-600 hover:underline font-medium"
        >
          Go to Segments
        </Link>
      ) : (
        <span className="text-gray-500">Login Required</span>
      ),
    },
    {
      number: 7,
      title: "Create Segment",
      description: "Save your segment for future use in campaigns.",
      action: user ? (
        <Link
          to="/segments"
          className="text-blue-600 hover:underline font-medium"
        >
          Create Segment
        </Link>
      ) : (
        <span className="text-gray-500">Login Required</span>
      ),
    },
    {
      number: 8,
      title: "Choose Segment & Generate AI Message",
      description:
        "Select your segment and use AI to create personalized messages.",
      action: user ? (
        <Link
          to="/campaigns"
          className="text-blue-600 hover:underline font-medium"
        >
          Go to Campaigns
        </Link>
      ) : (
        <span className="text-gray-500">Login Required</span>
      ),
    },
    {
      number: 9,
      title: "Generate AI Image",
      description: "Create compelling visuals for your campaign with AI.",
      action: user ? (
        <Link
          to="/campaigns"
          className="text-blue-600 hover:underline font-medium"
        >
          Try Image Generation
        </Link>
      ) : (
        <span className="text-gray-500">Login Required</span>
      ),
    },
    {
      number: 10,
      title: "Create Campaign",
      description: "Finalize and launch your marketing campaign.",
      action: user ? (
        <Link
          to="/campaigns"
          className="text-blue-600 hover:underline font-medium"
        >
          Create Campaign
        </Link>
      ) : (
        <span className="text-gray-500">Login Required</span>
      ),
    },
    {
      number: 11,
      title: "View Campaign Details",
      description:
        "Check campaign statistics, communication logs, and get AI-generated summaries.",
      action: user ? (
        <Link
          to="/campaigns"
          className="text-blue-600 hover:underline font-medium"
        >
          View Campaigns
        </Link>
      ) : (
        <span className="text-gray-500">Login Required</span>
      ),
    },
  ];

  return (
    <motion.div
      className="p-6 max-w-7xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-center mb-12"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 0.1,
          type: "spring",
          stiffness: 100,
          damping: 10,
        }}
      >
        <h1 className="text-4xl font-bold text-blue-800 mb-4">
          Welcome to CRMspace
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Your AI-powered customer relationship management platform. Follow this
          guide to get started.
        </p>
        {!user && (
          <motion.div
            className="mt-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2 text-lg"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 48 48"
                className="inline-block"
              >
                <g>
                  <path
                    fill="#4285F4"
                    d="M43.6 20.5H42V20H24v8h11.3C34.7 32.1 29.8 35 24 35c-6.1 0-11.3-4.1-13.1-9.6-1.8-5.5.2-11.6 5.1-15C19.2 6.1 24.8 6 29.2 8.7l6.2-6.2C31.1.7 27.6 0 24 0 14.6 0 6.4 6.8 3.1 16.1c-3.3 9.3.2 19.6 8.3 24.9 8.1 5.3 19.1 3.7 25.7-3.7 5.1-5.7 6.5-14.1 4.1-21.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M6.3 14.1l6.6 4.8C14.2 15.1 18.7 12 24 12c3.1 0 6 .9 8.3 2.6l6.2-6.2C34.9 3.7 29.8 2 24 2 15.6 2 8.1 7.6 6.3 14.1z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M24 46c5.4 0 10.4-1.8 14.3-4.9l-6.6-5.4C29.9 37.7 27 38.5 24 38.5c-5.7 0-10.6-3.7-12.4-8.9l-6.6 5.1C8.1 42.4 15.6 46 24 46z"
                  />
                  <path
                    fill="#EA4335"
                    d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.6 5.7-6.6 7.2l6.6 5.4C41.9 38.2 44 32.7 44 27c0-1.1-.1-2.2-.4-3.2z"
                  />
                </g>
              </svg>
              Sign in with Google
            </Link>
          </motion.div>
        )}
        {user && (
          <motion.div
            className="mt-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-lg"
            >
              Go to Dashboard
            </Link>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {steps.map((step) => (
          <motion.div
            key={step.number}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-100 relative overflow-hidden"
            variants={itemVariants}
            whileHover="hover"
            custom={cardHoverVariants}
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 text-blue-800 font-bold rounded-full h-10 w-10 flex items-center justify-center mr-3 shadow-sm">
                {step.number}
              </div>
              <h3 className="text-xl font-semibold text-gray-800">
                {step.title}
              </h3>
            </div>
            <p className="text-gray-600 mb-4 pl-1">{step.description}</p>
            <div className="mt-auto pl-1">{step.action}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 shadow-sm"
        id="mock-data"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.8,
          duration: 0.7,
          type: "spring",
          stiffness: 50,
          damping: 14,
        }}
      >
        <motion.h2
          className="text-3xl font-bold text-blue-800 mb-6 relative inline-block"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          Using Mock Data
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded" />
        </motion.h2>

        <motion.div
          className="mb-10 bg-white p-6 rounded-lg shadow-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1 }}
        >
          <h3 className="text-xl font-semibold text-blue-700 mb-3 border-b border-blue-100 pb-2">
            Step 2: Making POST Requests for Customers
          </h3>
          <p className="mb-3">
            To send customer data to the system, make a POST request to this
            endpoint:
          </p>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-md overflow-x-auto mb-4">
            <pre className="font-mono">
              <code>{`# Add customer data
POST http://localhost:5003/api/customers`}</code>
            </pre>
          </div>
          <p className="mb-3">When using Postman or another API platform:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>
              Set the request method to{" "}
              <span className="font-semibold">POST</span>
            </li>
            <li>
              Use the URL:{" "}
              <span className="font-mono text-blue-600">
                http://localhost:5003/api/customers
              </span>
            </li>
            <li>
              Set the request body format to{" "}
              <span className="font-semibold">JSON</span>
            </li>
            <li>Include customer data in the format shown below</li>
            <li>
              Add a header with key <span className="font-mono">Cookie</span>{" "}
              and value{" "}
              <span className="font-mono">
                connect.sid=&lt;replace with your cookie value stored inside
                browser application&gt;
              </span>
            </li>
          </ul>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-md overflow-x-auto mb-4">
            <pre className="font-mono">
              <code>{`{
  "name": "Bob Singh",
  "email": "bob@example.com",
  "totalSpend": 3500,
  "lastVisit": "2024-04-15T09:00:00Z",
  "lastOrderDate": "2024-04-10T14:00:00Z",
  "visitCount": 2
}`}</code>
            </pre>
          </div>
        </motion.div>

        <motion.div
          className="mb-10 bg-white p-6 rounded-lg shadow-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
        >
          <h3 className="text-xl font-semibold text-blue-700 mb-3 border-b border-blue-100 pb-2">
            Step 3: Making POST Requests for Orders
          </h3>
          <p className="mb-3">
            To send order data to the system, make a POST request to this
            endpoint:
          </p>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-md overflow-x-auto mb-4">
            <pre className="font-mono">
              <code>{`# Add order data
POST http://localhost:5003/api/orders`}</code>
            </pre>
          </div>
          <p className="mb-3">When using Postman or another API platform:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>
              Set the request method to{" "}
              <span className="font-semibold">POST</span>
            </li>
            <li>
              Use the URL:{" "}
              <span className="font-mono text-blue-600">
                http://localhost:5003/api/orders
              </span>
            </li>
            <li>
              Set the request body format to{" "}
              <span className="font-semibold">JSON</span>
            </li>
            <li>Include order data in the format shown below</li>
            <li>
              Replace{" "}
              <span className="font-mono">&lt;MongoDB ObjectId&gt;</span> with
              the actual MongoDB ObjectId of the customer from your database
            </li>
            <li>
              Add a header with key <span className="font-mono">Cookie</span>{" "}
              and value{" "}
              <span className="font-mono">
                connect.sid=&lt;replace with your cookie value stored inside
                browser application&gt;
              </span>
            </li>
          </ul>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-md overflow-x-auto mb-4">
            <pre className="font-mono">
              <code>{`{
  "customerId": "<MongoDB ObjectId from your customer document>",
  "orderAmount": 5000,
  "createdAt": "2024-04-28T12:00:00Z"
}`}</code>
            </pre>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Note: You must first create a customer and use their ObjectId in the
            order request.
          </p>
        </motion.div>

        <motion.div
          className="bg-white p-6 rounded-lg shadow-sm"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3 }}
        >
          <h3 className="text-xl font-semibold text-blue-700 mb-3 border-b border-blue-100 pb-2">
            Step 5: Sample Mock Data
          </h3>
          <p className="mb-3">
            Below is an example of the mock customer data format you can use:
          </p>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-md overflow-x-auto mb-5">
            <pre className="font-mono">
              <code>{`[
  {
    "name": "Bob Singh",
    "email": "bob@example.com",
    "totalSpend": 3500,
    "lastVisit": "2024-04-15T09:00:00Z",
    "lastOrderDate": "2024-04-10T14:00:00Z",
    "visitCount": 2
  },
  {
    "name": "Carol Patel",
    "email": "carol@example.com",
    "totalSpend": 8000,
    "lastVisit": "2024-03-20T11:00:00Z",
    "lastOrderDate": "2024-03-18T16:00:00Z",
    "visitCount": 4
  }
]`}</code>
            </pre>
          </div>

          <p className="mb-3">Example of the mock order data format:</p>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-md overflow-x-auto mb-5">
            <pre className="font-mono">
              <code>{`[
  {
    "customerId": "<MongoDB ObjectId for Alice Sharma>",
    "orderAmount": 5000,
    "createdAt": "2024-04-28T12:00:00Z"
  },
  {
    "customerId": "<MongoDB ObjectId for bob Singh>",
    "orderAmount": 5000,
    "createdAt": "2024-04-28T12:00:00Z"
  },
  {
    "customerId": "<MongoDB ObjectId for carol patel>",
    "orderAmount": 5000,
    "createdAt": "2024-04-28T12:00:00Z"
  }
]`}</code>
            </pre>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Note: This is sample data for reference only, not actual customer
            information.
          </p>
          <p className="mb-3">Available API endpoints for working with data:</p>
          <div className="bg-gray-900 text-gray-100 p-5 rounded-md overflow-x-auto mb-5">
            <pre className="font-mono">
              <code>{`# Import mock data to your database
POST /api/import-mock-data

# View available mock customers
GET /api/customers

# View available mock orders
GET /api/orders`}</code>
            </pre>
          </div>
          <p className="text-sm text-gray-600">
            Note: You need to be authenticated to use these endpoints.
          </p>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-16 text-center mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <h2 className="text-2xl font-bold text-blue-800 mb-3">
          Ready to Start?
        </h2>
        <p className="mb-5 text-gray-600 max-w-2xl mx-auto">
          Follow the steps above to create powerful, targeted marketing
          campaigns using AI-driven segmentation and content generation.
        </p>
        {!user ? (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/login"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 inline-block"
            >
              Sign in to Begin
            </Link>
          </motion.div>
        ) : (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/dashboard"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 inline-block"
            >
              Go to Dashboard
            </Link>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
