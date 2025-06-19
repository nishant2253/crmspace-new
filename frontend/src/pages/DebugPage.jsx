import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { testAPI } from "../services/api";
import axios from "axios";

const DebugPage = () => {
  const { user, loading, error, debugInfo, loginWithGoogle } = useAuth();
  const [dbStatus, setDbStatus] = useState(null);
  const [authStatus, setAuthStatus] = useState(null);
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [testResponse, setTestResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setApiBaseUrl(
      import.meta.env.VITE_API_URL || "https://crmspace2253.vercel.app"
    );
  }, []);

  const checkDbStatus = async () => {
    setIsLoading(true);
    try {
      const result = await testAPI.checkDbStatus();
      setDbStatus(result);
    } catch (err) {
      setDbStatus({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const result = await testAPI.checkAuthStatus();
      setAuthStatus(result);
    } catch (err) {
      setAuthStatus({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const testEndpoint = async (endpoint) => {
    setIsLoading(true);
    try {
      const result = await axios.get(`${apiBaseUrl}${endpoint}`, {
        withCredentials: true,
      });
      setTestResponse({
        status: result.status,
        data: result.data,
        headers: result.headers,
      });
    } catch (err) {
      setTestResponse({
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug Page</h1>

      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold">Current Authentication Status:</h2>
        {loading ? (
          <p>Loading authentication status...</p>
        ) : (
          <div>
            <p>Authenticated: {user ? "Yes ✅" : "No ❌"}</p>
            {user && (
              <div className="mt-2">
                <p>User ID: {user.id}</p>
                <p>Email: {user.email}</p>
                <p>Name: {user.name}</p>
              </div>
            )}
            {error && (
              <div className="text-red-500 mt-2">
                <p>Error: {error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <button
          onClick={loginWithGoogle}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Login with Google
        </button>
        <button
          onClick={checkDbStatus}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={isLoading}
        >
          Check DB Status
        </button>
        <button
          onClick={checkAuthStatus}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          disabled={isLoading}
        >
          Check Auth Status
        </button>
      </div>

      <div className="mb-4">
        <h2 className="font-bold mb-2">Test API Endpoint:</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            className="border p-2 rounded flex-grow"
            placeholder="API Base URL"
          />
          <button
            onClick={() => testEndpoint("/test")}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            disabled={isLoading}
          >
            Test /test
          </button>
          <button
            onClick={() => testEndpoint("/test/db-status")}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            disabled={isLoading}
          >
            Test /db-status
          </button>
          <button
            onClick={() => testEndpoint("/test/auth-status")}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
            disabled={isLoading}
          >
            Test /auth-status
          </button>
        </div>
      </div>

      {isLoading && <p className="text-blue-500">Loading...</p>}

      {dbStatus && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-bold mb-2">Database Status:</h2>
          <pre className="bg-white p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(dbStatus, null, 2)}
          </pre>
        </div>
      )}

      {authStatus && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-bold mb-2">Auth Status:</h2>
          <pre className="bg-white p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(authStatus, null, 2)}
          </pre>
        </div>
      )}

      {testResponse && (
        <div className="bg-gray-100 p-4 rounded mb-4">
          <h2 className="font-bold mb-2">Test Response:</h2>
          <pre className="bg-white p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(testResponse, null, 2)}
          </pre>
        </div>
      )}

      {debugInfo && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Debug Info:</h2>
          <pre className="bg-white p-2 rounded overflow-auto max-h-60">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugPage;
