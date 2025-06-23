import React from "react";
import { useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { loginWithGoogle } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";

const navigation = [
  { name: "Dashboard", href: "/" },
  { name: "Customers", href: "/customers" },
  { name: "Orders", href: "/orders" },
  { name: "Campaigns", href: "/campaigns" },
  { name: "Analytics", href: "/analytics" },
  { name: "Settings", href: "/settings" },
];

const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const titleVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.2,
      type: "spring",
      stiffness: 100,
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delay: 0.3,
      type: "spring",
      stiffness: 200,
      damping: 10,
    },
  },
  hover: {
    scale: 1.05,
    boxShadow: "0px 5px 10px rgba(0, 0, 0, 0.1)",
  },
  tap: {
    scale: 0.95,
  },
};

const profileVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.3,
      type: "spring",
      stiffness: 100,
    },
  },
};

const avatarVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: {
      delay: 0.4,
      type: "spring",
      stiffness: 200,
      damping: 10,
    },
  },
};

export default function Header() {
  const location = useLocation();
  const { user, logout, isGuestUser } = useAuth();

  const currentPage =
    navigation.find((item) => item.href === location.pathname)?.name ||
    "Dashboard";

  return (
    <motion.div
      className="h-16 bg-white border-b px-6 flex items-center justify-between"
      variants={headerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        className="text-xl font-semibold"
        variants={titleVariants}
        layout
      >
        {currentPage}
      </motion.h1>

      <AnimatePresence mode="wait">
        {user ? (
          <motion.div
            className="flex items-center gap-4"
            key="user-profile"
            variants={profileVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, x: 20 }}
          >
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              {user.picture ? (
                <motion.img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                  variants={avatarVariants}
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                />
              ) : (
                <motion.div
                  className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
                  variants={avatarVariants}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {user.name ? user.name[0] : "U"}
                </motion.div>
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                {isGuestUser && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">
                    Guest Mode
                  </span>
                )}
              </div>
            </motion.div>
            <motion.div
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="login-button"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              onClick={loginWithGoogle}
              className="flex items-center gap-2"
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
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
