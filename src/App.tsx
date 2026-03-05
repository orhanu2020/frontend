import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import UserDetails from "./components/UserDetails";
import TwitterAccountPage from "./components/TwitterAccountPage";
import AccountMonitoring from "./components/AccountMonitoring";
import KeywordSearch from "./components/KeywordSearch";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Header />
        <div style={{ display: "flex" }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              minHeight: "calc(100vh - 64px)",
              backgroundColor: "#f5f5f5",
            }}
          >
            <Routes>
              <Route path="/" element={<KeywordSearch />} />
              <Route path="/keyword-search" element={<KeywordSearch />} />
              <Route path="/users/:username" element={<UserDetails />} />
              <Route path="/twitter/:accountName" element={<TwitterAccountPage />} />
              <Route path="/monitoring" element={<AccountMonitoring />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
