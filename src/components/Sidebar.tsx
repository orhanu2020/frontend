import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Keyword Search",
      path: "/keyword-search",
      icon: "🔎",
    },
    {
      label: "Keyword Monitoring",
      path: "/monitoring",
      icon: "📊",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/keyword-search") {
      return location.pathname === "/" || location.pathname.startsWith("/keyword-search");
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      style={{
        width: "240px",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e0e0e0",
        height: "calc(100vh - 64px)",
        position: "sticky",
        top: "64px",
        padding: "20px 0",
      }}
    >
      <nav>
        {menuItems.map((item) => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              padding: "12px 24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: isActive(item.path) ? "#f0f7ff" : "transparent",
              borderLeft: isActive(item.path)
                ? "3px solid #007bff"
                : "3px solid transparent",
              color: isActive(item.path) ? "#007bff" : "#333",
              fontWeight: isActive(item.path) ? "600" : "400",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive(item.path)) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <span style={{ fontSize: "18px" }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;


