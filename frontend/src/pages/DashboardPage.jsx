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
        <div className="text-center">
          <Spinner size="lg" className="mx-auto text-blue-600" />
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            className="hover-lift animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="flex items-center p-6">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
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
              <div className={`${stat.color} p-4 rounded-full bg-gray-50`}>
                <stat.icon size={24} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Segments */}
        <Card
          className="lg:col-span-2 animate-slide-in"
          style={{ animationDelay: "200ms" }}
        >
          <CardHeader>
            <CardTitle>Customer Segments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                  >
                    {segmentData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              {segmentData.map((segment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm">{segment.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="animate-slide-in" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 animate-fade-in hover-lift"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <div
                    className={`p-2 rounded-full 
                    ${
                      activity.type === "customer"
                        ? "bg-blue-100 text-blue-600"
                        : activity.type === "order"
                        ? "bg-purple-100 text-purple-600"
                        : "bg-teal-100 text-teal-600"
                    }`}
                  >
                    {activity.type === "customer" ? (
                      <Users size={16} />
                    ) : activity.type === "order" ? (
                      <ShoppingCart size={16} />
                    ) : (
                      <Mail size={16} />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {activity.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Campaigns Table */}
      <Card
        className="mt-6 animate-slide-in"
        style={{ animationDelay: "500ms" }}
      >
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Campaign Name</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Audience</th>
                  <th className="text-left py-3 px-4">Delivered</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Performance</th>
                </tr>
              </thead>
              <tbody>
                {recentCampaigns.map((campaign, index) => (
                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4">{campaign.name}</td>
                    <td className="py-3 px-4">{campaign.date}</td>
                    <td className="py-3 px-4">{campaign.audience}</td>
                    <td className="py-3 px-4">{campaign.delivered}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: campaign.performance }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
