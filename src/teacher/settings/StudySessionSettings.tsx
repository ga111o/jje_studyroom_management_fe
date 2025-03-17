import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StudySessionSettings.css";

interface StudyRoom {
  id: string;
  name: string;
}

interface StudySession {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  one_grade: boolean;
  two_grade: boolean;
  three_grade: boolean;
  minutes_before: number;
  minutes_after: number;
  room: {
    id: string;
    name: string;
  };
}

const StudySessionSettings = () => {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [studyRooms, setStudyRooms] = useState<StudyRoom[]>([]);
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    start_time: "",
    end_time: "",
    one_grade: false,
    two_grade: false,
    three_grade: false,
    minutes_before: 0,
    minutes_after: 0,
    room_id: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem("teacherToken");
          navigate("/teacher/login");
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [navigate]);

  useEffect(() => {
    fetchStudySessions();
    fetchStudyRooms();
  }, []);

  const fetchStudySessions = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/session/`
      );
      setStudySessions(response.data.study_sessions);
    } catch (error) {
      console.error("Error fetching study sessions:", error);
    }
  };

  const fetchStudyRooms = async () => {
    try {
      console.log(localStorage.getItem("teacherToken"));
      console.log(import.meta.env.VITE_API_URL);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/studyroom/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );
      const data = await response.json();
      console.log(data.studyrooms);
      setStudyRooms(data.studyrooms);
    } catch (err) {
      console.log(err);
      console.error(err);
    }
  };

  const handleSelectSession = async (sessionId: number) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/session/${sessionId}`
      );
      setSelectedSession(response.data.study_session);
      setIsEditing(false);
      setIsCreating(false);
    } catch (error) {
      console.error("Error fetching study session details:", error);
    }
  };

  const handleCreateSession = async () => {
    try {
      const requestData = {
        name: formData.name,
        start_time: formData.start_time,
        end_time: formData.end_time,
        one_grade: formData.one_grade,
        two_grade: formData.two_grade,
        three_grade: formData.three_grade,
        minutes_before: formData.minutes_before,
        minutes_after: formData.minutes_after,
        room_id: String(formData.room_id),
      };

      console.log(requestData);
      console.log(localStorage.getItem("teacherToken"));

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/session/`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response);

      fetchStudySessions();
      setIsCreating(false);
      resetForm();
    } catch (error) {
      console.error("Error creating study session:", error);
      alert("Failed to create study session. Please check the form data.");
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession) return;
    const requestData = {
      name: formData.name,
      start_time: formData.start_time,
      end_time: formData.end_time,
      one_grade: formData.one_grade,
      two_grade: formData.two_grade,
      three_grade: formData.three_grade,
      minutes_before: formData.minutes_before,
      minutes_after: formData.minutes_after,
      room_id: String(formData.room_id),
    };
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/session/${selectedSession.id}`,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            "Content-Type": "application/json",
          },
        }
      );
      fetchStudySessions();
      const updatedSession = await axios.get(
        `${import.meta.env.VITE_API_URL}/session/${selectedSession.id}`
      );
      setSelectedSession(updatedSession.data.study_session);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating study session:", error);
      alert("Failed to update study session. Please check the form data.");
    }
  };

  const handleDeleteSession = async () => {
    if (
      !selectedSession ||
      !window.confirm("Are you sure you want to delete this study session?")
    )
      return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/session/${selectedSession.id}`
      );
      fetchStudySessions();
      setSelectedSession(null);
    } catch (error) {
      console.error("Error deleting study session:", error);
      alert("Failed to delete study session.");
    }
  };

  const startEditing = () => {
    if (!selectedSession) return;

    setFormData({
      name: selectedSession.name,
      start_time: selectedSession.start_time,
      end_time: selectedSession.end_time,
      one_grade: selectedSession.one_grade,
      two_grade: selectedSession.two_grade,
      three_grade: selectedSession.three_grade,
      minutes_before: selectedSession.minutes_before,
      minutes_after: selectedSession.minutes_after,
      room_id: selectedSession.room.id,
    });

    setIsEditing(true);
    setIsCreating(false);
  };

  const startCreating = () => {
    resetForm();
    setIsCreating(true);
    setIsEditing(false);
    setSelectedSession(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      start_time: "",
      end_time: "",
      one_grade: false,
      two_grade: false,
      three_grade: false,
      minutes_before: 0,
      minutes_after: 0,
      room_id: studyRooms.length > 0 ? studyRooms[0].id : "",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const cancelAction = () => {
    setIsEditing(false);
    setIsCreating(false);
  };

  return (
    <div className="study-session-settings">
      <h2 className="settings-title">야자 관리</h2>
      <p className="settings-description">
        야자 시간 및 대상 학년을 설정하세요.
      </p>

      <div className="settings-content">
        <div className="session-list-container">
          <div className="section-header">
            <h3>야자 목록</h3>
            <button className="create-button" onClick={startCreating}>
              새 야자 추가
            </button>
          </div>

          {studySessions.length === 0 ? (
            <p className="empty-state">등록된 야자가 없습니다.</p>
          ) : (
            <ul className="session-list">
              {studySessions.map((session) => (
                <li
                  key={session.id}
                  className={`session-item ${
                    selectedSession?.id === session.id ? "active" : ""
                  }`}
                  onClick={() => handleSelectSession(session.id)}
                >
                  <span className="session-name">{session.name}</span>
                  <span className="session-room">{session.room.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="session-details-container">
          {isEditing || isCreating ? (
            <div className="session-form">
              <h3 className="form-title">
                {isCreating ? "야자 생성" : "야자 수정"}
              </h3>

              <div className="form-group">
                <label className="form-label">
                  야자 이름
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="1학년 1차 야자"
                  />
                </label>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label">
                    시작 시간
                    <input
                      type="time"
                      name="start_time"
                      className="form-input"
                      value={formData.start_time}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                </div>

                <div className="form-group half">
                  <label className="form-label">
                    종료 시간
                    <input
                      type="time"
                      name="end_time"
                      className="form-input"
                      value={formData.end_time}
                      onChange={handleInputChange}
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">대상 학년</label>
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="one_grade"
                      checked={formData.one_grade}
                      onChange={handleInputChange}
                    />
                    <span>1학년</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="two_grade"
                      checked={formData.two_grade}
                      onChange={handleInputChange}
                    />
                    <span>2학년</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="three_grade"
                      checked={formData.three_grade}
                      onChange={handleInputChange}
                    />
                    <span>3학년</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label className="form-label">
                    신청 가능 시간 (시작 전)
                    <div className="input-with-unit">
                      <input
                        type="number"
                        name="minutes_before"
                        className="form-input"
                        value={formData.minutes_before}
                        onChange={handleInputChange}
                        min="0"
                      />
                      <span className="input-unit">분</span>
                    </div>
                  </label>
                </div>

                <div className="form-group half">
                  <label className="form-label">
                    신청 가능 시간 (시작 후)
                    <div className="input-with-unit">
                      <input
                        type="number"
                        name="minutes_after"
                        className="form-input"
                        value={formData.minutes_after}
                        onChange={handleInputChange}
                        min="0"
                      />
                      <span className="input-unit">분</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  야자실
                  <select
                    name="room_id"
                    className="form-select"
                    value={formData.room_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">야자실 선택</option>
                    {studyRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-actions">
                <button
                  className="primary-button"
                  onClick={
                    isCreating ? handleCreateSession : handleUpdateSession
                  }
                >
                  {isCreating ? "생성하기" : "수정하기"}
                </button>
                <button className="secondary-button" onClick={cancelAction}>
                  취소
                </button>
              </div>
            </div>
          ) : selectedSession ? (
            <div className="session-detail">
              <h3 className="detail-title">야자 상세 정보</h3>

              <div className="detail-row">
                <div className="detail-label">이름</div>
                <div className="detail-value">{selectedSession.name}</div>
              </div>

              <div className="detail-row">
                <div className="detail-label">시간</div>
                <div className="detail-value">
                  {selectedSession.start_time} ~ {selectedSession.end_time}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">대상 학년</div>
                <div className="detail-value">
                  {[
                    selectedSession.one_grade ? "1학년" : null,
                    selectedSession.two_grade ? "2학년" : null,
                    selectedSession.three_grade ? "3학년" : null,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">신청 가능 시간</div>
                <div className="detail-value">
                  시작 {selectedSession.minutes_before}분 전 ~ 시작{" "}
                  {selectedSession.minutes_after}분 후
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">야자실</div>
                <div className="detail-value">{selectedSession.room.name}</div>
              </div>

              <div className="detail-actions">
                <button className="primary-button" onClick={startEditing}>
                  수정
                </button>
                <button className="danger-button" onClick={handleDeleteSession}>
                  삭제
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-detail-state">
              <p>좌측 목록에서 야자를 선택하거나 새 야자를 추가하세요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudySessionSettings;
