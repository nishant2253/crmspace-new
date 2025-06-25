import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { FadeIn } from "../components/ui/fade-in";
import { AnimatedButton } from "../components/ui/animated-button";
import { motion } from "framer-motion";

export default function NotFoundPage() {
  const { user } = useAuth();

  return (
    <FadeIn className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 10 }}
        className="text-9xl font-bold text-gray-200"
      >
        404
      </motion.div>

      <motion.h1
        className="text-3xl font-bold mb-4 mt-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Page Not Found
      </motion.h1>

      <motion.p
        className="mb-8 text-gray-500"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        The page you are looking for does not exist.
      </motion.p>

      <AnimatedButton>
        {user ? (
          <Link to="/dashboard" className="text-white">
            Return to Dashboard
          </Link>
        ) : (
          <Link to="/get-started" className="text-white">
            Go to Get Started
          </Link>
        )}
      </AnimatedButton>
    </FadeIn>
  );
}
