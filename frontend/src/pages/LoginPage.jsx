import React from "react";
import { loginWithGoogle, loginAsGuest } from "../services/api";
import { FadeIn } from "../components/ui/fade-in";
import { AnimatedButton } from "../components/ui/animated-button";
import { motion } from "framer-motion";

export default function LoginPage() {
  const handleLogin = () => {
    loginWithGoogle();
  };

  const handleGuestLogin = () => {
    loginAsGuest();
  };

  return (
    <FadeIn className="flex flex-col items-center justify-center min-h-[60vh]">
      <motion.h1
        className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        Welcome to CRMspace
      </motion.h1>

      <motion.div
        className="flex flex-col sm:flex-row gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <AnimatedButton
          onClick={handleLogin}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"
        >
          <motion.svg
            width="20"
            height="20"
            viewBox="0 0 48 48"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
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
          </motion.svg>
          Sign in with Google
        </AnimatedButton>

        <AnimatedButton
          onClick={handleGuestLogin}
          className="bg-gray-600 text-white px-6 py-2 rounded shadow hover:bg-gray-700 flex items-center gap-2"
        >
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            whileHover={{ scale: 1.2 }}
            transition={{ duration: 0.3 }}
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </motion.svg>
          Continue as Guest
        </AnimatedButton>
      </motion.div>

      <motion.p
        className="mt-6 text-sm text-gray-500 max-w-md text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        Guest login provides limited access to explore the platform. Sign in
        with Google for full access to all features.
      </motion.p>
    </FadeIn>
  );
}
