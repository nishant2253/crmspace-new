import React, { useEffect, useState } from "react";
import { apiGet, apiPost, apiPostNoCredentials } from "../services/api";
import { previewSegmentAudience } from "../services/segmentUtils";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function SegmentsPage() {
  const navigate = useNavigate();
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [rulesJSON, setRulesJSON] = useState({ rules: [], condition: "AND" });
  const [aiPrompt, setAiPrompt] = useState("");
  const [audiencePreview, setAudiencePreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [useLocalPreview, setUseLocalPreview] = useState(false);
  const [mockDataStatus, setMockDataStatus] = useState({
    loaded: false,
    count: 0,
  });
  const [importingMockData, setImportingMockData] = useState(false);

  useEffect(() => {
    // Fetch segments and mock data status
    Promise.all([
      apiGet("/api/segments"),
      apiGet("/test/mock-data-status").catch(() => ({
        mockDataLoaded: false,
        mockCustomerCount: 0,
      })),
    ])
      .then(([segmentsData, mockStatus]) => {
        setSegments(segmentsData);
        setMockDataStatus({
          loaded: mockStatus.mockDataLoaded,
          count: mockStatus.mockCustomerCount,
        });
      })
      .catch((err) => console.error("Error fetching data:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      const seg = await apiPost("/api/segments", {
        name,
        rulesJSON,
        useMockData: useLocalPreview,
      });
      setSegments([seg, ...segments]);

      // Navigate to campaigns page with the new segment ID
      navigate(`/campaigns?createCampaign=true&segmentId=${seg._id}`);
    } catch (err) {
      setError(err?.response?.data?.error || "Error creating segment");
    } finally {
      setCreating(false);
    }
  };

  const handlePreview = async () => {
    setError("");
    setPreviewLoading(true);
    setAudiencePreview(null);

    try {
      console.log("Previewing segment with rules:", rulesJSON);

      // First, get data from the API with mock data flag
      const apiResponse = await apiPost("/api/segments/preview", {
        rulesJSON,
        useMockData: useLocalPreview,
      });
      console.log("API preview response:", apiResponse);

      // If using local preview and API doesn't have mock data, supplement with local preview
      if (useLocalPreview && !apiResponse.usedMockData) {
        const localResponse = previewSegmentAudience(rulesJSON);
        console.log("Local preview response:", localResponse);

        // Combine API and local data, avoiding duplicates by email
        const combinedSample = [...apiResponse.sample];
        const apiEmails = new Set(apiResponse.sample.map((c) => c.email));

        // Add local samples that don't exist in API response
        localResponse.sample.forEach((customer) => {
          if (!apiEmails.has(customer.email)) {
            combinedSample.push(customer);
          }
        });

        setAudiencePreview({
          audienceSize: apiResponse.audienceSize + localResponse.audienceSize,
          sample: combinedSample.slice(0, 10), // Limit to 10 samples
          apiCount: apiResponse.audienceSize,
          localCount: localResponse.audienceSize,
        });
      } else {
        // Just use the API response
        setAudiencePreview(apiResponse);
      }

      if (
        apiResponse.audienceSize === 0 &&
        (!useLocalPreview ||
          previewSegmentAudience(rulesJSON).audienceSize === 0)
      ) {
        setError(
          "No customers match these rules. Try adjusting your criteria."
        );
      }
    } catch (err) {
      console.error("Preview error:", err);

      // If API fails but local preview is enabled, fall back to local data only
      if (useLocalPreview) {
        try {
          const localResponse = previewSegmentAudience(rulesJSON);
          console.log("Fallback to local preview:", localResponse);

          setAudiencePreview({
            audienceSize: localResponse.audienceSize,
            sample: localResponse.sample,
            apiCount: 0,
            localCount: localResponse.audienceSize,
            apiError: true,
          });

          if (localResponse.audienceSize === 0) {
            setError(
              "No customers match these rules. Try adjusting your criteria."
            );
          } else {
            setError(
              "API error: Using local data only. " +
                (err?.response?.data?.error || "Preview API failed.")
            );
          }
        } catch (localErr) {
          setError("Preview failed. Check your rules format.");
        }
      } else {
        setError(
          err?.response?.data?.error ||
            "Preview failed. Check your rules format."
        );
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImportMockData = async () => {
    setImportingMockData(true);
    setError("");
    try {
      const result = await apiPostNoCredentials("/test/import-mock-data");
      setMockDataStatus({
        loaded: true,
        count: result.count,
      });
      setUseLocalPreview(true); // Automatically enable mock data usage
    } catch (err) {
      setError(
        "Failed to import mock data: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setImportingMockData(false);
    }
  };

  const handleRemoveMockData = async () => {
    setImportingMockData(true);
    setError("");
    try {
      await apiPostNoCredentials("/test/remove-mock-data");
      setMockDataStatus({ loaded: false, count: 0 });
      setUseLocalPreview(false);
    } catch (err) {
      setError(
        "Failed to remove mock data: " +
          (err.response?.data?.error || err.message)
      );
    } finally {
      setImportingMockData(false);
    }
  };

  const handleAiAssist = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    setError("");
    try {
      // Using the test endpoint without authentication requirement
      const res = await apiPostNoCredentials("/test/segment-rules-from-text", {
        prompt: aiPrompt,
      });
      setRulesJSON(res.rulesJSON);
    } catch (err) {
      setError(
        "AI assist failed: " + (err.response?.data?.error || err.message)
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleRulesJSONChange = (e) => {
    try {
      const parsed = JSON.parse(e.target.value);
      setRulesJSON(parsed);
      setError("");
    } catch (err) {
      setError("Invalid JSON format");
    }
  };

  // Example rule to help users
  const addExampleRule = () => {
    setRulesJSON({
      rules: [
        { field: "totalSpend", operator: ">", value: 5000 },
        { field: "visitCount", operator: ">=", value: 3 },
      ],
      condition: "AND",
    });
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 10 },
    },
  };

  const customerCardVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    }),
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1
        className="text-2xl font-bold mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        Segments
      </motion.h1>
      <motion.form
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        onSubmit={handleCreate}
        className="bg-white p-4 rounded shadow mb-6"
      >
        <div className="mb-2">
          <label className="block font-semibold mb-1">Segment Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border px-2 py-1 rounded w-full"
            required
          />
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1">AI Rule Builder</label>
          <div className="flex gap-2">
            <input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="border px-2 py-1 rounded w-full"
              placeholder="e.g. People who haven't shopped in 6 months and spent over ₹5K"
            />
            <motion.button
              type="button"
              onClick={handleAiAssist}
              className="bg-blue-500 text-white px-3 py-1 rounded"
              disabled={aiLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {aiLoading ? "Thinking..." : "AI Assist"}
            </motion.button>
          </div>
        </div>
        <div className="mb-2">
          <label className="block font-semibold mb-1">
            Rules JSON
            <motion.button
              type="button"
              onClick={addExampleRule}
              className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add Example
            </motion.button>
          </label>
          <textarea
            value={JSON.stringify(rulesJSON, null, 2)}
            onChange={handleRulesJSONChange}
            className="border px-2 py-1 rounded w-full font-mono text-xs"
            rows={4}
          />
          <div className="text-xs text-gray-500 mt-1">
            Format:{" "}
            {
              "{ rules: [{ field: 'totalSpend', operator: '>', value: 5000 }], condition: 'AND' }"
            }
          </div>
        </div>
        <div className="flex flex-col mb-4">
          <div className="flex items-center mb-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-blue-600"
                checked={useLocalPreview}
                onChange={(e) => setUseLocalPreview(e.target.checked)}
              />
              <span className="ml-2 text-sm">Use mock data</span>
            </label>
            <div className="ml-2">
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {useLocalPreview ? "Including Mock Data" : "Real Data Only"}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mb-2">
            <motion.button
              type="button"
              onClick={handleImportMockData}
              className="bg-purple-500 text-white px-3 py-1 rounded text-sm"
              disabled={importingMockData || mockDataStatus.loaded}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {importingMockData ? "Importing..." : "Import Mock Data to DB"}
            </motion.button>
            {mockDataStatus.loaded && (
              <motion.button
                type="button"
                onClick={handleRemoveMockData}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                disabled={importingMockData}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Remove Mock Data
              </motion.button>
            )}
          </div>

          {mockDataStatus.loaded && (
            <div className="text-xs text-green-600 mb-2">
              {mockDataStatus.count} mock customers loaded in database
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-2">
          <motion.button
            type="button"
            onClick={handlePreview}
            className="bg-gray-500 text-white px-3 py-1 rounded"
            disabled={previewLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {previewLoading ? "Loading..." : "Preview Audience"}
          </motion.button>
          <motion.button
            type="submit"
            className="bg-green-600 text-white px-3 py-1 rounded"
            disabled={creating}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {creating ? "Creating..." : "Create Segment"}
          </motion.button>
        </div>
        {error && (
          <motion.div
            className="text-red-600 mb-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}
        <AnimatePresence>
          {audiencePreview && (
            <motion.div
              className="bg-gray-50 p-4 rounded mt-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-lg">Audience Preview</span>
                {useLocalPreview && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {audiencePreview.apiError
                      ? "Local Data Only"
                      : mockDataStatus.loaded
                      ? "Including Mock DB Data"
                      : "Combined with Frontend Mock Data"}
                  </span>
                )}
              </div>
              <div className="font-semibold">
                Audience Size: {audiencePreview.audienceSize}
                {useLocalPreview && !audiencePreview.apiError && (
                  <span className="text-sm font-normal ml-2">
                    ({audiencePreview.apiCount} from API,{" "}
                    {audiencePreview.localCount} from local)
                  </span>
                )}
              </div>

              {audiencePreview.sample && audiencePreview.sample.length > 0 ? (
                <div className="mt-3">
                  <h3 className="text-sm font-semibold mb-2">
                    Sample Customers:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {audiencePreview.sample.map((customer, index) => (
                      <motion.div
                        key={`${customer.email}-${index}`}
                        className={`bg-white p-3 rounded shadow-sm border ${
                          customer._id && !customer.isMockData
                            ? "border-gray-200"
                            : "border-blue-200"
                        }`}
                        custom={index}
                        variants={customerCardVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium">{customer.name}</div>
                          {(!customer._id || customer.isMockData) && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded">
                              Mock
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {customer.email}
                        </div>
                        <div className="mt-1 text-xs">
                          <div className="flex justify-between">
                            <span>Total Spend:</span>
                            <span className="font-medium">
                              ₹{customer.totalSpend}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Visit Count:</span>
                            <span className="font-medium">
                              {customer.visitCount}
                            </span>
                          </div>
                          {customer.lastVisit && (
                            <div className="flex justify-between">
                              <span>Last Visit:</span>
                              <span className="font-medium">
                                {new Date(
                                  customer.lastVisit
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 mt-2">
                  No matching customers found.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.form>
      <motion.h2
        className="text-xl font-semibold mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Your Segments
      </motion.h2>
      {loading ? (
        <div>Loading segments...</div>
      ) : segments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          No segments created yet
        </motion.div>
      ) : (
        <motion.div
          className="grid gap-4"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial="hidden"
          animate="show"
        >
          {segments.map((segment) => (
            <motion.div
              key={segment._id}
              className="bg-white p-4 rounded shadow"
              variants={cardVariants}
              whileHover={{ y: -5, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{segment.name}</h3>
                {segment.useMockData && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Uses Mock Data
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Audience Size: {segment.audienceSize}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Rules: {JSON.stringify(segment.rulesJSON)}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
