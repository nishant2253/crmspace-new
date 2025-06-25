import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { loginAsGuest } from "../services/api";
import { FadeIn } from "../components/ui/fade-in";
import { AnimatedButton } from "../components/ui/animated-button";
import { AnimatedCard } from "../components/ui/animated-card";
import { ScrollReveal } from "../components/ui/scroll-reveal";
import { Tooltip } from "../components/ui/tooltip";

export default function GetStartedPage() {
  const { user, setGuestUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      const guestUser = await loginAsGuest();
      // Use the specialized function for guest login
      setGuestUser(guestUser);
      // No need to navigate - setGuestUser handles it
    } catch (error) {
      console.error("Guest login error:", error);
      setIsLoading(false);
    }
  };

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

  // We're not using this anymore since we're using AnimatedCard
  const cardHoverVariants = {
    hover: {
      y: -5,
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
    <FadeIn className="p-6 max-w-7xl mx-auto">
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
          Your all-in-one customer relationship management solution with
          AI-powered segmentation and campaign tools.
        </p>

        {!user && (
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
            >
              Sign in with Google
            </Link>
            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>Continue as Guest</>
              )}
            </button>
          </div>
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

      <FadeIn
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        staggerItems
      >
        {steps.map((step, index) => (
          <ScrollReveal
            key={step.number}
            delay={index * 0.05}
            direction={
              index % 3 === 0 ? "left" : index % 3 === 2 ? "right" : "up"
            }
          >
            <AnimatedCard delay={index * 0.05}>
              <div className="p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
                <div className="flex items-center mb-4">
                  <motion.div
                    className="bg-blue-100 text-blue-800 font-bold rounded-full h-10 w-10 flex items-center justify-center mr-3 shadow-sm"
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {step.number}
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {step.title}
                  </h3>
                </div>
                <p className="text-gray-600 mb-4 pl-1">{step.description}</p>
                <div className="mt-auto pl-1">
                  <Tooltip content={`Step ${step.number}: ${step.title}`}>
                    {step.action}
                  </Tooltip>
                </div>
              </div>
            </AnimatedCard>
          </ScrollReveal>
        ))}
      </FadeIn>

      <ScrollReveal
        className="mt-16 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 shadow-sm"
        id="mock-data"
        direction="up"
        delay={0.8}
        distance={40}
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
      </ScrollReveal>

      <ScrollReveal
        className="mt-16 text-center mb-10"
        direction="up"
        delay={1.5}
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
      </ScrollReveal>
    </FadeIn>
  );
}
