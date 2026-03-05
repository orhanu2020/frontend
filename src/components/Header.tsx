import React from "react";
import { useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header
      style={{
        height: "64px",
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e0e0e0",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div
        onClick={() => navigate("/")}
        style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#007bff",
          cursor: "pointer",
          letterSpacing: "0.5px",
        }}
      >
        SoMeTo
      </div>
    </header>
  );
};

export default Header;




