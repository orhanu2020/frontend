import React from "react";
import { UserSearchResult as UserSearchResultType } from "../types";

interface UserSearchResultProps {
  user: UserSearchResultType;
  onSelect: (user: UserSearchResultType) => void;
}

const UserSearchResult: React.FC<UserSearchResultProps> = ({
  user,
  onSelect,
}) => {
  const getPlatformColor = (platform?: string) => {
    switch (platform?.toLowerCase()) {
      case "twitter":
        return "#1DA1F2";
      case "instagram":
        return "#E4405F";
      case "youtube":
        return "#FF0000";
      default:
        return "#6c757d";
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        margin: "8px 0",
        backgroundColor: "#ffffff",
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: "bold",
            color: "#333",
          }}
        >
          {(user.userName || "?").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#333",
              marginBottom: "6px",
            }}
          >
            {user.userName || "Unknown"}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {user.platform && (
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  backgroundColor: getPlatformColor(user.platform),
                  color: "white",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: "500",
                  textTransform: "capitalize",
                }}
              >
                {user.platform}
              </span>
            )}
            {user.location && (
              <span
                style={{
                  fontSize: "13px",
                  color: "#666",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                📍 {user.location}
              </span>
            )}
            {user.createdAt && (
              <span
                style={{
                  fontSize: "13px",
                  color: "#999",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                📅 {formatDate(user.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => onSelect(user)}
        style={{
          padding: "10px 24px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 2px 4px rgba(0, 123, 255, 0.2)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#0056b3";
          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 123, 255, 0.3)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#007bff";
          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 123, 255, 0.2)";
        }}
      >
        Load
      </button>
    </div>
  );
};

export default UserSearchResult;
