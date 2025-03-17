import React, { useState } from "react";
import IssueSettings from "./settings/IssueSettings";
import StudyRoomSettings from "./settings/StudyRoomSettings";
import StudySessionSettings from "./settings/StudySessionSettings";
import "./Settings.css";
import { useNavigate } from "react-router-dom";
type SettingTab = "studyRoom" | "studySession" | "issue";

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingTab>("studyRoom");

  const renderTabContent = () => {
    switch (activeTab) {
      case "studyRoom":
        return <StudyRoomSettings />;
      case "studySession":
        return <StudySessionSettings />;
      case "issue":
        return <IssueSettings />;
      default:
        return <div>선택된 설정이 없습니다.</div>;
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h2>설정</h2>
        <button className="back-button" onClick={() => navigate("/")}>
          홈으로 이동
        </button>
      </div>

      <div className="settings-container">
        <div className="settings-navigation">
          <button
            className={`settings-tab-button ${
              activeTab === "studyRoom" ? "active" : ""
            }`}
            onClick={() => setActiveTab("studyRoom")}
          >
            <i className="icon-room"></i>
            <span>야자실 관리</span>
          </button>
          <button
            className={`settings-tab-button ${
              activeTab === "studySession" ? "active" : ""
            }`}
            onClick={() => setActiveTab("studySession")}
          >
            <i className="icon-session"></i>
            <span>야자 관리</span>
          </button>
          <button
            className={`settings-tab-button ${
              activeTab === "issue" ? "active" : ""
            }`}
            onClick={() => setActiveTab("issue")}
          >
            <i className="icon-issue"></i>
            <span>특이사항 목록 관리</span>
          </button>
        </div>

        <div className="settings-content-wrapper">
          <div className="settings-content-card">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
