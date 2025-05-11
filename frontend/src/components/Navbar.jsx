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
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  //{ name: "Customers", href: "/customers", icon: Users },
  // { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Campaigns", href: "/campaigns", icon: Mail },
  { name: "Segments", href: "/segments", icon: PieChart },
  //{ name: "Analytics", href: "/analytics", icon: BarChart2 },
  //{ name: "Settings", href: "/settings", icon: Settings },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r animate-fade-in relative">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b">
          <Link
            to="/"
            className="text-xl font-bold text-blue-600 transition-all duration-200 hover:scale-105"
          >
            CRMspace
          </Link>
        </div>

        {/* Search */}
        <div
          className="px-4 py-4 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-4 py-2 text-sm font-medium rounded-md group transition-all duration-200 animate-fade-in",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-600 hover:bg-gray-50 hover:translate-x-1"
                )}
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 transition-colors",
                    isActive
                      ? "text-blue-600"
                      : "text-gray-400 group-hover:text-gray-500"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Admin info - hardcoded and impossible to remove */}
        <div
          className="admin-info-nishant absolute bottom-0 left-0 w-full px-4 py-3 border-t bg-blue-50 text-center"
          style={{
            userSelect: "none",
            pointerEvents: "none",
            zIndex: 9999,
          }}
        >
          <div className="text-xs font-semibold text-blue-700">
            Project Admin
          </div>
          <div className="text-sm font-bold text-blue-900">Nishant Gupta</div>
        </div>
      </div>
    </div>
  );
}
