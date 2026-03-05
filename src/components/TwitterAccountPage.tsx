import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User } from "../types";
import { api } from "../services/api";
import LoadingSpinner from "./LoadingSpinner";
import DateRangePicker from "./DateRangePicker";
import TweetList from "./TweetList";

const TwitterAccountPage: React.FC = () => {
  const { accountName } = useParams<{ accountName: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTweets, setLoadingTweets] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set default dates: since = 30 days ago, until = today
  const getDefaultSinceDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split("T")[0];
  };

  const getDefaultUntilDate = () => {
    return new Date().toISOString().split("T")[0];
  };

  const [sinceDate, setSinceDate] = useState(getDefaultSinceDate());
  const [untilDate, setUntilDate] = useState(getDefaultUntilDate());

  useEffect(() => {
    const loadAccount = async () => {
      if (!accountName) return;

      setLoading(true);
      setError(null);
      try {
        // Preview only: fetch from DB or API without saving to DB.
        const userData = await api.getUserByUsername(accountName);
        if (userData) {
          setUser(userData);
        } else {
          setError("Account not found");
        }
      } catch (error: any) {
        console.error("Error loading account:", error);
        setError(
          error.response?.data?.message ||
            "Failed to load account. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [accountName]);

  const handleLoadTweets = async () => {
    if (!accountName) return;

    if (new Date(untilDate) < new Date(sinceDate)) {
      setError("End date cannot be before start date");
      return;
    }

    setLoadingTweets(true);
    setError(null);
    try {
      const loadedTweets = await api.getTweets(
        accountName,
        sinceDate,
        untilDate
      );
      setTweets(loadedTweets);
    } catch (error) {
      console.error("Error loading tweets:", error);
      setError("Failed to load tweets. Please try again.");
    } finally {
      setLoadingTweets(false);
    }
  };

  const handleSave = async () => {
    if (!accountName) return;

    setSavedMessage(null);
    setSavingUser(true);
    try {
      const saved = await api.saveUserToDatabase(accountName);
      if (saved) {
        setUser(saved);
        setSavedMessage("User saved to database.");
      } else {
        setSavedMessage("Could not save user.");
      }
    } catch (err) {
      console.error("Error saving user:", err);
      setSavedMessage("Error saving user. Please try again.");
    } finally {
      setSavingUser(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <LoadingSpinner />
        <p style={{ marginTop: "20px", color: "#666" }}>Loading account...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px" }}>
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <p style={{ color: "#856404", margin: 0 }}>⚠️ {error}</p>
        </div>
        <button
          onClick={() => navigate("/keyword-search")}
          style={{
            padding: "10px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Back to Search
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: "40px" }}>
        <p>Account not found</p>
        <button onClick={() => navigate("/keyword-search")}>Back to Search</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/keyword-search")}
        style={{
          marginBottom: "20px",
          padding: "10px 24px",
          backgroundColor: "#6c757d",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        ← Back to Search
      </button>

      {/* Twitter Account Header */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "24px",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "24px" }}>
          {/* Profile Picture or Avatar */}
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              backgroundColor: user.profilePicture ? "transparent" : "#1DA1F2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              fontWeight: "bold",
              color: "white",
              flexShrink: 0,
              backgroundImage: user.profilePicture
                ? `url(${user.profilePicture})`
                : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!user.profilePicture &&
              (user.userName?.charAt(0).toUpperCase() || "?")}
          </div>

          {/* Account Info */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#333",
                }}
              >
                {user.name || user.userName || "Unknown"}
              </h1>
              {user.isVerified && (
                <span style={{ fontSize: "20px", color: "#1DA1F2" }}>✓</span>
              )}
              {user.isBlueVerified && (
                <span style={{ fontSize: "20px", color: "#1DA1F2" }}>✓</span>
              )}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 12px",
                  backgroundColor: "#1DA1F2",
                  color: "white",
                  borderRadius: "16px",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                @{user.userName}
              </span>
            </div>

            {user.description && (
              <p
                style={{
                  fontSize: "16px",
                  color: "#333",
                  marginBottom: "16px",
                  lineHeight: "1.5",
                }}
              >
                {user.description}
              </p>
            )}

            <div
              style={{
                display: "flex",
                gap: "24px",
                flexWrap: "wrap",
                marginBottom: "16px",
              }}
            >
              {user.location && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#666",
                  }}
                >
                  <span>📍</span>
                  <span>{user.location}</span>
                </div>
              )}
              {user.url && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#666",
                  }}
                >
                  <span>🔗</span>
                  <a
                    href={user.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#1DA1F2", textDecoration: "none" }}
                  >
                    {user.url}
                  </a>
                </div>
              )}
              {user.createdAt && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#666",
                  }}
                >
                  <span>📅</span>
                  <span>
                    Joined{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                gap: "24px",
                color: "#666",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              {user.following !== undefined && user.following !== null && (
                <div>
                  <strong style={{ color: "#333" }}>
                    {user.following.toLocaleString()}
                  </strong>{" "}
                  <span>Following</span>
                </div>
              )}
              {user.followers !== undefined && user.followers !== null && (
                <div>
                  <strong style={{ color: "#333" }}>
                    {user.followers.toLocaleString()}
                  </strong>{" "}
                  <span>Followers</span>
                </div>
              )}
              {user.statusesCount !== undefined &&
                user.statusesCount !== null && (
                  <div>
                    <strong style={{ color: "#333" }}>
                      {user.statusesCount.toLocaleString()}
                    </strong>{" "}
                    <span>Tweets</span>
                  </div>
                )}
              {user.mediaCount !== undefined && user.mediaCount !== null && (
                <div>
                  <strong style={{ color: "#333" }}>
                    {user.mediaCount.toLocaleString()}
                  </strong>{" "}
                  <span>Media</span>
                </div>
              )}
            </div>

            {/* Additional Account Details */}
            <div
              style={{
                marginTop: "24px",
                paddingTop: "24px",
                borderTop: "1px solid #e0e0e0",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {user.platformId && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "4px",
                    }}
                  >
                    Platform ID
                  </div>
                  <div style={{ fontSize: "14px", color: "#333" }}>
                    {user.platformId}
                  </div>
                </div>
              )}
              {user.verifiedType && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "4px",
                    }}
                  >
                    Verified Type
                  </div>
                  <div style={{ fontSize: "14px", color: "#333" }}>
                    {user.verifiedType}
                  </div>
                </div>
              )}
              {user.fastFollowersCount !== undefined && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "4px",
                    }}
                  >
                    Fast Followers
                  </div>
                  <div style={{ fontSize: "14px", color: "#333" }}>
                    {user.fastFollowersCount.toLocaleString()}
                  </div>
                </div>
              )}
              {user.isAutomated !== undefined && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "4px",
                    }}
                  >
                    Account Type
                  </div>
                  <div style={{ fontSize: "14px", color: "#333" }}>
                    {user.isAutomated ? "Automated" : "Personal"}
                  </div>
                </div>
              )}
              {user.canDm !== undefined && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "4px",
                    }}
                  >
                    Direct Messages
                  </div>
                  <div style={{ fontSize: "14px", color: "#333" }}>
                    {user.canDm ? "Enabled" : "Disabled"}
                  </div>
                </div>
              )}
              {user.possiblySensitive !== undefined && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "4px",
                    }}
                  >
                    Content
                  </div>
                  <div style={{ fontSize: "14px", color: "#333" }}>
                    {user.possiblySensitive
                      ? "May contain sensitive content"
                      : "Standard content"}
                  </div>
                </div>
              )}
              {user.firstSeenAt && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "4px",
                    }}
                  >
                    First Seen
                  </div>
                  <div style={{ fontSize: "14px", color: "#333" }}>
                    {new Date(user.firstSeenAt).toLocaleDateString()}
                  </div>
                </div>
              )}
              {user.updatedAt && (
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      marginBottom: "4px",
                    }}
                  >
                    Last Updated
                  </div>
                  <div style={{ fontSize: "14px", color: "#333" }}>
                    {new Date(user.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>

            {/* About Profile (from get_user_about API) */}
            {user.aboutProfile && Object.keys(user.aboutProfile).length > 0 && (
              <div
                style={{
                  marginTop: "24px",
                  paddingTop: "24px",
                  borderTop: "1px solid #e0e0e0",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#333",
                    marginBottom: "16px",
                  }}
                >
                  About Profile
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {Object.entries(user.aboutProfile as Record<string, unknown>).map(
                    ([key, val]) => {
                      if (val === undefined || val === null) return null;
                      const label = key.replace(/_/g, " ");
                      const display =
                        typeof val === "object" &&
                        val !== null &&
                        !Array.isArray(val)
                          ? (val as Record<string, unknown>).count != null
                            ? String((val as Record<string, unknown>).count)
                            : JSON.stringify(val)
                          : typeof val === "boolean"
                            ? String(val)
                            : String(val);
                      return (
                        <div key={key}>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#999",
                              marginBottom: "4px",
                            }}
                          >
                            {label}
                          </div>
                          <div style={{ fontSize: "14px", color: "#333" }}>
                            {display}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Save to database */}
            <div
              style={{
                marginTop: "24px",
                paddingTop: "24px",
                borderTop: "1px solid #e0e0e0",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleSave}
                disabled={savingUser}
                style={{
                  padding: "10px 24px",
                  backgroundColor: "#1DA1F2",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: savingUser ? "not-allowed" : "pointer",
                  fontWeight: "500",
                }}
              >
                {savingUser ? "Saving..." : "Save to database"}
              </button>
              {savedMessage && (
                <span
                  style={{
                    color:
                      savedMessage.startsWith("Error") ||
                      savedMessage.includes("Could not")
                        ? "#c00"
                        : "#080",
                    fontSize: "14px",
                  }}
                >
                  {savedMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Picker */}
      <DateRangePicker
        since={sinceDate}
        until={untilDate}
        onSinceChange={setSinceDate}
        onUntilChange={setUntilDate}
        onLoadTweets={handleLoadTweets}
      />

      {loadingTweets && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <LoadingSpinner />
        </div>
      )}

      {/* Tweet List */}
      <TweetList tweets={tweets} />
    </div>
  );
};

export default TwitterAccountPage;
