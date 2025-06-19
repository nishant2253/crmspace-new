import React from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import DashboardPage from "./pages/DashboardPage";
import CampaignsPage from "./pages/CampaignsPage";
import SegmentsPage from "./pages/SegmentsPage";
import GetStartedPage from "./pages/GetStartedPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "./contexts/AuthContext";
import DebugPage from "./pages/DebugPage";

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.2,
      ease: "easeIn",
    },
  },
};

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  const isPublicRoute =
    location.pathname === "/login" || location.pathname === "/404";

  return (
    <div className="flex h-screen bg-gray-50">
      {!isPublicRoute && <Navbar />}
      <div
        className={`${
          isPublicRoute ? "w-full" : "flex-1 flex flex-col"
        } overflow-hidden`}
      >
        {!isPublicRoute && <Header />}
        <main
          className={`${isPublicRoute ? "h-full" : "flex-1"} overflow-auto`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="exit"
              variants={pageVariants}
              className="h-full"
            >
              <Routes location={location}>
                <Route
                  path="/"
                  element={<Navigate to="/get-started" replace />}
                />
                <Route path="/get-started" element={<GetStartedPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/campaigns"
                  element={
                    <ProtectedRoute>
                      <CampaignsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/segments"
                  element={
                    <ProtectedRoute>
                      <SegmentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/debug" element={<DebugPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
