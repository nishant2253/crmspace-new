import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Mail,
  BarChart2,
  Settings,
  Search,
  PieChart,
  BookOpen,
} from "lucide-react";
import { motion } from "framer-motion";

const navigation = [
  { name: "Get Started", href: "/get-started", icon: BookOpen },
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  //{ name: "Customers", href: "/customers", icon: Users },
  // { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Campaigns", href: "/campaigns", icon: Mail },
  { name: "Segments", href: "/segments", icon: PieChart },
  //{ name: "Analytics", href: "/analytics", icon: BarChart2 },
  //{ name: "Settings", href: "/settings", icon: Settings },
];

// Animation variants
const sidebarVariants = {
  hidden: { x: -64, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      staggerChildren: 0.07,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 10 },
  },
};

const logoVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: "spring", stiffness: 200, damping: 10 },
  },
};

export default function Navbar() {
  const location = useLocation();

  // Create motion component for Link
  const MotionLink = motion.create(Link);

  return (
    <motion.div
      className="w-64 bg-white border-r relative"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <motion.div variants={logoVariants}>
            <motion.div
              className="text-xl font-bold text-blue-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/">CRMspace</Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Search */}
        <motion.div className="px-4 py-4" variants={itemVariants}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <motion.input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              initial={{ width: "90%" }}
              whileFocus={{
                width: "100%",
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.3)",
              }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </motion.div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <motion.div
                key={item.name}
                variants={itemVariants}
                whileHover={{ x: 5 }}
                custom={index}
              >
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md group",
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <motion.div
                    whileHover={!isActive ? { rotate: 10, scale: 1.1 } : {}}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5",
                        isActive
                          ? "text-blue-600"
                          : "text-gray-400 group-hover:text-gray-500"
                      )}
                    />
                  </motion.div>
                  {item.name}
                  {isActive && (
                    <motion.div
                      className="absolute inset-y-0 left-0 w-1 bg-blue-600 rounded-r-md"
                      layoutId="activeNavIndicator"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Admin info */}
        <motion.div
          className="admin-info-nishant absolute bottom-0 left-0 w-full px-4 py-3 border-t bg-blue-50 text-center"
          style={{
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 9999,
          }}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5, type: "spring" }}
        >
          <div className="text-xs font-semibold text-blue-700">
            Project Admin
          </div>
          <div className="text-sm font-bold text-blue-900">Nishant Gupta</div>
        </motion.div>
      </div>
    </motion.div>
  );
}
