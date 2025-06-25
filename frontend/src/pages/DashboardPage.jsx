import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
  Users,
  ShoppingCart,
  Mail,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Spinner } from "../components/ui/spinner";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { FadeIn } from "../components/ui/fade-in";
import { AnimatedCard } from "../components/ui/animated-card";
import { AnimatedButton } from "../components/ui/animated-button";
import { ScrollReveal } from "../components/ui/scroll-reveal";
import { Tooltip } from "../components/ui/tooltip";

const statsCards = [
  {
    title: "Total Customers",
    value: "2,845",
    change: "+12.5%",
    icon: Users,
    color: "text-blue-600",
  },
  {
    title: "Total Orders",
    value: "1,257",
    change: "+8.2%",
    icon: ShoppingCart,
    color: "text-purple-600",
  },
  {
    title: "Campaigns",
    value: "34",
    change: "+24.3%",
    icon: Mail,
    color: "text-teal-600",
  },
  {
    title: "Avg. Response",
    value: "85%",
    change: "-2.1%",
    icon: TrendingUp,
    color: "text-amber-600",
  },
];

const segmentData = [
  { name: "High Value", value: 25, color: "#4F46E5" },
  { name: "Regular", value: 45, color: "#10B981" },
  { name: "Occasional", value: 20, color: "#F59E0B" },
  { name: "At Risk", value: 10, color: "#EF4444" },
];

const recentActivity = [
  {
    type: "customer",
    title: "New customer registered",
    name: "John Smith",
    time: "5 minutes ago",
  },
  {
    type: "order",
    title: "New order placed",
    name: "Order #58492",
    time: "15 minutes ago",
  },
  {
    type: "campaign",
    title: "Campaign delivered",
    name: "Summer Promotion",
    time: "1 hour ago",
  },
];

const recentCampaigns = [
  {
    name: "Summer Sale Promotion",
    date: "01/05/2025",
    audience: "1250",
    delivered: "1187 (95%)",
    status: "Completed",
    performance: "95%",
  },
];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const { isGuestUser } = useAuth();

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Spinner size="lg" className="mx-auto text-blue-600" />
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <FadeIn className="p-6">
      {/* Guest User Warning Banner */}
      {isGuestUser && (
        <motion.div
          className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>You're using guest mode.</strong> Some features are
                limited.
                <Link to="/login" className="font-medium underline ml-1">
                  Sign in with Google
                </Link>{" "}
                for full access.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <FadeIn
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        staggerItems
      >
        {statsCards.map((stat, index) => (
          <AnimatedCard
            key={index}
            className="hover:shadow-lg transition-shadow duration-300"
            delay={index * 0.1}
          >
            <CardContent className="flex items-center p-6">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <motion.h3
                  className="text-2xl font-bold mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  {stat.value}
                </motion.h3>
                <p
                  className={`text-sm mt-2 ${
                    stat.change.startsWith("+")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stat.change} vs last month
                </p>
              </div>
              <Tooltip content={`${stat.title} statistics`}>
                <motion.div
                  className={`${stat.color} p-4 rounded-full bg-gray-50`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    delay: 0.3 + index * 0.1,
                  }}
                >
                  <stat.icon size={24} />
                </motion.div>
              </Tooltip>
            </CardContent>
          </AnimatedCard>
        ))}
      </FadeIn>

      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Segments */}
        <ScrollReveal direction="left" className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {segmentData.map((segment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: segment.color }}
                      ></div>
                      <span className="text-sm">{segment.name}</span>
                    </div>
                    <span className="text-sm font-medium">
                      {segment.value}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Recent Activity */}
        <ScrollReveal direction="up" delay={0.2} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-gray-500">{activity.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <AnimatedButton variant="outline" size="sm">
                  View All Activity
                </AnimatedButton>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>

        {/* Recent Campaigns */}
        <ScrollReveal direction="right" delay={0.4} className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCampaigns.map((campaign, index) => (
                  <div key={index} className="p-3 rounded-lg bg-gray-50">
                    <p className="text-sm font-medium">{campaign.name}</p>
                    <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p>{campaign.date}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Audience</p>
                        <p>{campaign.audience}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p>{campaign.status}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Performance</p>
                        <p>{campaign.performance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <AnimatedButton variant="outline" size="sm">
                  View All Campaigns
                </AnimatedButton>
              </div>
            </CardContent>
          </Card>
        </ScrollReveal>
      </div>

      {/* Quick Actions */}
      <ScrollReveal direction="up" delay={0.6} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <AnimatedButton>Create Campaign</AnimatedButton>
            <AnimatedButton variant="outline">Add Customer</AnimatedButton>
            <AnimatedButton variant="outline">Generate Report</AnimatedButton>
          </CardContent>
        </Card>
      </ScrollReveal>
    </FadeIn>
  );
}
