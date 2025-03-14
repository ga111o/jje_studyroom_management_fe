import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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

  const renderSessionForm = () => {
    return (
      <div>
        <h3>{isCreating ? "야자 생성" : "야자 수정"}</h3>
        <div>
          <label>
            야자 이름:
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="1학년 1차 야자"
            />
          </label>
        </div>
        <div>
          <label>
            야자 시작 시간:
            <input
              type="time"
              name="start_time"
              value={formData.start_time}
              onChange={handleInputChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            야자 종료 시간:
            <input
              type="time"
              name="end_time"
              value={formData.end_time}
              onChange={handleInputChange}
              required
            />
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="one_grade"
              checked={formData.one_grade}
              onChange={handleInputChange}
            />
            1학년 야자
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="two_grade"
              checked={formData.two_grade}
              onChange={handleInputChange}
            />
            2학년 야자
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="three_grade"
              checked={formData.three_grade}
              onChange={handleInputChange}
            />
            3학년 야자
          </label>
        </div>
        <div>
          <label>
            야자 신청 가능 시간 (야자 시작 n분 전부터)
            <input
              type="number"
              name="minutes_before"
              value={formData.minutes_before}
              onChange={handleInputChange}
              min="0"
            />
          </label>
        </div>
        <div>
          <label>
            야자 신청 가능 시간 (야자 시작 n분 후까지)
            <input
              type="number"
              name="minutes_after"
              value={formData.minutes_after}
              onChange={handleInputChange}
              min="0"
            />
          </label>
        </div>
        <div>
          <label>
            야자실:
            <select
              name="room_id"
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
        <div>
          <button
            onClick={isCreating ? handleCreateSession : handleUpdateSession}
          >
            {isCreating ? "Create" : "Update"}
          </button>
          <button onClick={cancelAction}>Cancel</button>
        </div>
      </div>
    );
  };

  const renderSessionDetails = () => {
    if (!selectedSession) return null;

    return (
      <div>
        <h3>Study Session Details</h3>
        <p>
          <strong>Name:</strong> {selectedSession.name}
        </p>
        <p>
          <strong>Start Time:</strong> {selectedSession.start_time}
        </p>
        <p>
          <strong>End Time:</strong> {selectedSession.end_time}
        </p>
        <p>
          <strong>Grades:</strong>
          {[
            selectedSession.one_grade ? "1st" : null,
            selectedSession.two_grade ? "2nd" : null,
            selectedSession.three_grade ? "3rd" : null,
          ]
            .filter(Boolean)
            .join(", ")}
        </p>
        <p>
          <strong>Minutes Before:</strong> {selectedSession.minutes_before}
        </p>
        <p>
          <strong>Minutes After:</strong> {selectedSession.minutes_after}
        </p>
        <p>
          <strong>Room:</strong> {selectedSession.room.name}
        </p>

        <div>
          <button onClick={startEditing}>Edit</button>
          <button onClick={handleDeleteSession}>Delete</button>
        </div>
      </div>
    );
  };

  const renderSessionList = () => {
    return (
      <div>
        <h3>Study Sessions</h3>
        {studySessions.length === 0 ? (
          <p>No study sessions found.</p>
        ) : (
          <ul>
            {studySessions.map((session) => (
              <li
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
              >
                {session.name} - {session.room.name}
              </li>
            ))}
          </ul>
        )}
        <button onClick={startCreating}>Create New Session</button>
      </div>
    );
  };

  return (
    <div>
      <h2>Study Session Settings</h2>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>{renderSessionList()}</div>
        <div style={{ flex: 2 }}>
          {isEditing || isCreating
            ? renderSessionForm()
            : renderSessionDetails()}
        </div>
      </div>
    </div>
  );
};

export default StudySessionSettings;
