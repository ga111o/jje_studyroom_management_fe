import React, { useState } from "react";
import IssueSettings from "./settings/IssueSettings";
import StudyRoomSettings from "./settings/StudyRoomSettings";
import StudySessionSettings from "./settings/StudySessionSettings";

type SettingTab = "studyRoom" | "studySession" | "issue";

const Settings: React.FC = () => {
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
    <div className="settings-container">
      <h1>설정</h1>

      <div className="settings-tabs">
        <button
          className={activeTab === "studyRoom" ? "active" : ""}
          onClick={() => setActiveTab("studyRoom")}
        >
          야자실 관리
        </button>
        <button
          className={activeTab === "studySession" ? "active" : ""}
          onClick={() => setActiveTab("studySession")}
        >
          야자 관리
        </button>
        <button
          className={activeTab === "issue" ? "active" : ""}
          onClick={() => setActiveTab("issue")}
        >
          특이사항 목록 관리
        </button>
      </div>

      <div className="settings-content">{renderTabContent()}</div>
    </div>
  );
};

export default Settings;
