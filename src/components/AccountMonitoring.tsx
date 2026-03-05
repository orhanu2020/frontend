import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { AccountMonitoringEntry } from "../types";
import LoadingSpinner from "./LoadingSpinner";
import ConfirmModal from "./ConfirmModal";

const AccountMonitoring: React.FC = () => {
  const [entries, setEntries] = useState<AccountMonitoringEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for single entry
  const [keyword, setKeyword] = useState("");
  const [keywordType, setKeywordType] = useState<"account" | "tweet">("account");
  const [platform, setPlatform] = useState("twitter");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Multiline text input
  const [multilineText, setMultilineText] = useState("");

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [entryToRemove, setEntryToRemove] = useState<number | null>(null);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMonitoringEntries();
      setEntries(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load monitoring entries");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSingleEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!keyword.trim() || !platform || !startTime || !endTime) {
      setError("All fields are required");
      return;
    }

    if (new Date(endTime) < new Date(startTime)) {
      setError("End time cannot be before start time");
      return;
    }

    try {
      await api.addMonitoringEntry(keyword.trim(), platform, keywordType, startTime, endTime);
      setSuccess("Entry added successfully");
      setKeyword("");
      setKeywordType("account");
      setPlatform("twitter");
      setStartTime("");
      setEndTime("");
      await loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add entry");
    }
  };

  const handleAddMultilineEntries = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!multilineText.trim()) {
      setError("Multiline text cannot be empty");
      return;
    }

    try {
      const result = await api.addMonitoringEntriesFromMultiline(multilineText);
      setSuccess(`Successfully added ${result.count} entries`);
      setMultilineText("");
      await loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add entries");
    }
  };

  const handleRemoveEntryClick = (index: number) => {
    setEntryToRemove(index);
    setShowConfirmModal(true);
  };

  const handleConfirmRemove = async () => {
    if (entryToRemove === null) return;

    setError(null);
    setSuccess(null);
    setShowConfirmModal(false);

    try {
      await api.removeMonitoringEntry(entryToRemove);
      setSuccess("Entry removed successfully");
      await loadEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to remove entry");
    } finally {
      setEntryToRemove(null);
    }
  };

  const handleCancelRemove = () => {
    setShowConfirmModal(false);
    setEntryToRemove(null);
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <LoadingSpinner />
        <p style={{ marginTop: "20px", color: "#666" }}>Loading monitoring entries...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "24px", fontSize: "28px", fontWeight: "700", color: "#333" }}>
        Keyword Monitoring
      </h1>

      {error && (
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            color: "#856404",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: "#d4edda",
            border: "1px solid #28a745",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "20px",
            color: "#155724",
          }}
        >
          ✓ {success}
        </div>
      )}

      {/* Current Entries List */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: "600", color: "#333" }}>
          Current Monitoring Entries ({entries.length})
        </h2>
        {entries.length === 0 ? (
          <p style={{ color: "#666", textAlign: "center", padding: "40px" }}>
            No monitoring entries yet. Add entries below to get started.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {entries.map((entry, index) => (
              <div
                key={index}
                style={{
                  padding: "12px 14px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  backgroundColor: "#f8f9fa",
                }}
              >
                <div><strong>Keyword:</strong> {entry.keyword ?? (entry as { accountName?: string }).accountName ?? "—"}</div>
                <div><strong>Type:</strong> {entry.keywordType ?? "account"}</div>
                <div><strong>Platform:</strong> {entry.platform}</div>
                <div><strong>Start:</strong> {entry.startTime}</div>
                <div><strong>End:</strong> {entry.endTime}</div>
                <div style={{ marginTop: "4px" }}>
                  <button
                    onClick={() => handleRemoveEntryClick(index)}
                    style={{
                      padding: "6px 14px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Single Entry Form */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: "600", color: "#333" }}>
          Add Single Entry
        </h2>
        <form onSubmit={handleAddSingleEntry} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "13px" }}>Keyword</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
              placeholder={keywordType === "account" ? "e.g., elonmusk" : "e.g., AI"}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "13px" }}>Type</label>
            <select
              value={keywordType}
              onChange={(e) => setKeywordType(e.target.value as "account" | "tweet")}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            >
              <option value="account">Account</option>
              <option value="tweet">Tweet</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "13px" }}>Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            >
              <option value="twitter">Twitter</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "13px" }}>Start</label>
            <input
              type="date"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "13px" }}>End</label>
            <input
              type="date"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min={startTime || undefined}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <button
              type="submit"
              style={{ padding: "8px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
            >
              Add Entry
            </button>
          </div>
        </form>
      </div>

      {/* Add Multiple Entries from Multiline Text */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <h2 style={{ marginBottom: "16px", fontSize: "20px", fontWeight: "600", color: "#333" }}>
          Add Multiple Entries (Multiline)
        </h2>
        <p style={{ marginBottom: "12px", color: "#666", fontSize: "14px" }}>
          Format: keyword:platform:keywordType:startTime:endTime (one per line). Type: <strong>account</strong> or <strong>tweet</strong>. Examples: elonmusk:twitter:account:2024-01-01:2024-01-31 | AI:twitter:tweet:2024-01-01:2024-01-31
        </p>
        <form onSubmit={handleAddMultilineEntries} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: "500", color: "#333", fontSize: "13px" }}>Entries (one per line)</label>
            <textarea
              value={multilineText}
              onChange={(e) => setMultilineText(e.target.value)}
              placeholder={"elonmusk:twitter:account:2024-01-01:2024-01-31\nAI:twitter:tweet:2024-01-01:2024-01-31"}
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "8px 10px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                fontFamily: "monospace",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <button
              type="submit"
              style={{ padding: "8px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "500" }}
            >
              Add Entries
            </button>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div
        style={{
          backgroundColor: "#e7f3ff",
          border: "1px solid #b3d9ff",
          borderRadius: "8px",
          padding: "16px",
          marginTop: "24px",
        }}
      >
        <p style={{ margin: 0, color: "#004085", fontSize: "14px" }}>
          <strong>ℹ️ Scheduled Task:</strong> All entries are processed automatically every day.
          <strong>Account</strong> entries: tweets are loaded for that account in the time range.
          <strong>Tweet</strong> entries: tweets matching the keyword are loaded; author users are fetched via user search when not already in the database, and each tweet is saved to the tweet database.
        </p>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Removal"
        message="Are you sure you want to remove this entry?"
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
        confirmText="Remove"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AccountMonitoring;

