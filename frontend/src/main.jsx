import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

// Function to ensure admin info is always present
const enforceAdminNamePresence = () => {
  // Create MutationObserver to monitor DOM changes
  const observer = new MutationObserver(() => {
    const adminInfoElement = document.querySelector(".admin-info-nishant");

    // If the admin info is removed, recreate it
    if (!adminInfoElement) {
      const navbar = document.querySelector(
        '[class*="navbar"], [class*="nav"], .w-64'
      );

      if (navbar) {
        // Create admin info element
        const adminInfoDiv = document.createElement("div");
        adminInfoDiv.className =
          "admin-info-nishant absolute bottom-0 left-0 w-full px-4 py-3 border-t bg-blue-50 text-center";
        adminInfoDiv.style.userSelect = "none";
        adminInfoDiv.style.pointerEvents = "none";
        adminInfoDiv.style.zIndex = "9999";

        // Add content
        adminInfoDiv.innerHTML = `
          <div class="text-xs font-semibold text-blue-700">Project Admin</div>
          <div class="text-sm font-bold text-blue-900">Nishant Gupta</div>
        `;

        navbar.style.position = "relative";
        navbar.appendChild(adminInfoDiv);
      }
    }
  });

  // Start observing the entire document with all possible subtree modifications
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
};

// Run the script after the app is mounted
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Execute after initial render to ensure DOM is available
setTimeout(enforceAdminNamePresence, 1000);
// Also run on every page load/navigation
window.addEventListener("load", enforceAdminNamePresence);
window.addEventListener("popstate", enforceAdminNamePresence);
