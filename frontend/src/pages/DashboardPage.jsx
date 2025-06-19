import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Users, ShoppingCart, Mail, TrendingUp } from "lucide-react";
import { Spinner } from "../components/ui/spinner";
import { motion } from "framer-motion";

// Convert regular components to motion components
const MotionCard = motion(Card);

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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10,
    },
  },
};

const chartVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const tableVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delay: 0.4,
      duration: 0.6,
    },
  },
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

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
    <div className="p-6">
      {/* Stats Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {statsCards.map((stat, index) => (
          <MotionCard
            key={index}
            className="hover:shadow-lg transition-shadow duration-300"
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
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
            </CardContent>
          </MotionCard>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Segments */}
        <motion.div
          className="lg:col-span-2"
          variants={chartVariants}
          initial="hidden"
          animate="show"
        >
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="h-[300px] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={segmentData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name} ${value}%`}
                      animationDuration={1500}
                    >
                      {segmentData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </motion.div>
              <motion.div
                className="flex justify-center gap-4 mt-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {segmentData.map((segment, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center gap-2"
                    variants={itemVariants}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="text-sm">{segment.name}</span>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={chartVariants} initial="hidden" animate="show">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate="show"
              >
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    className="flex items-start gap-4"
                    variants={itemVariants}
                    whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  >
                    <motion.div
                      className={`p-2 rounded-full 
                      ${
                        activity.type === "customer"
                          ? "bg-blue-100 text-blue-600"
                          : activity.type === "order"
                          ? "bg-purple-100 text-purple-600"
                          : "bg-teal-100 text-teal-600"
                      }`}
                      whileHover={{ scale: 1.1 }}
                    >
                      {activity.type === "customer" ? (
                        <Users size={16} />
                      ) : activity.type === "order" ? (
                        <ShoppingCart size={16} />
                      ) : (
                        <Mail size={16} />
                      )}
                    </motion.div>
                    <div>
                      <h4 className="text-sm font-medium">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {activity.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Campaigns */}
      <motion.div
        className="mt-6"
        variants={tableVariants}
        initial="hidden"
        animate="show"
      >
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Campaign Name</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Audience</th>
                  <th className="text-left p-4 font-medium">Delivered</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Performance</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((campaign, index) => (
                  <motion.tr
                    key={index}
                    className="border-b hover:bg-gray-50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                  >
                    <td className="p-4">{campaign.name}</td>
                    <td className="p-4">{campaign.date}</td>
                    <td className="p-4">{campaign.audience}</td>
                    <td className="p-4">{campaign.delivered}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        {campaign.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className="bg-blue-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: campaign.performance }}
                          transition={{ delay: 0.7, duration: 1 }}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
