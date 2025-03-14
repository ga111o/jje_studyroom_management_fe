import { useEffect, useState } from "react";
import axios from "axios";
import "./layout.css";
import { useNavigate } from "react-router-dom";
import SeatLayoutGrid, { SessionLayout, Student, Room } from "./SeatLayoutGrid";

interface StudySession {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  one_grade: boolean;
  two_grade: boolean;
  three_grade: boolean;
  minutes_before: number;
  minutes_after: number;
  room: Room;
}

interface IssueType {
  id: string;
  description: string;
}

const Layout = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionLayout, setSessionLayout] = useState<SessionLayout | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<{
    student: Student;
    registrationId: string;
  } | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string>("");
  const [memoText, setMemoText] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);

  const today = new Date();
  const yyyy = today.getFullYear().toString();
  const mm = (today.getMonth() + 1).toString().padStart(2, "0");
  const dd = today.getDate().toString().padStart(2, "0");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/session/`
        );
        setSessions(response.data.study_sessions);
        if (response.data.study_sessions.length > 0) {
          setSelectedSession(response.data.study_sessions[0].id);
        }
        console.log(response);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem("teacherToken");
          window.location.href = "/teacher/login";
          return;
        }
        setError("야자를 불러오는 중 오류가 발생했어요.");
        console.error(err);
      }
    };

    fetchSessions();
  }, []);

  useEffect(() => {
    if (!selectedSession) return;

    const fetchSessionLayout = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }/session/${selectedSession}/registrations/${yyyy}/${mm}/${dd}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            },
          }
        );
        setSessionLayout(response.data);
        console.log(response.data);
        setError(null);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem("teacherToken");
          window.location.href = "/teacher/login";
          return;
        }
        setError("야자 신청 현황을 불러오는 중 오류가 발생했어요.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionLayout();
  }, [selectedSession, yyyy, mm, dd]);

  useEffect(() => {
    const fetchIssueTypes = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/issue/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
            },
          }
        );
        setIssueTypes(response.data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem("teacherToken");
          window.location.href = "/teacher/login";
          return;
        }
        console.error("특이사항 목록을 불러오는 도중 오류가 발생했어요.", err);
      }
    };

    fetchIssueTypes();
  }, []);

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSession(e.target.value);
  };

  const handleStudentClick = (student: Student, registrationId: string) => {
    if (!student.id) return;

    setSelectedStudent({ student, registrationId });

    // Set the current issue type and memo when opening the modal
    if (student.issue_type) {
      setSelectedIssueId(student.issue_type);
    } else {
      setSelectedIssueId("");
    }

    if (student.note) {
      setMemoText(student.note);
    } else {
      setMemoText("");
    }

    fetchStudentIssueAndNote(registrationId);
    setModalOpen(true);
  };

  const fetchStudentIssueAndNote = async (registrationId: string) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/issue/student/${registrationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );

      if (selectedStudent) {
        setSelectedStudent((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            student: {
              ...prev.student,
              issue_type: response.data.issue_type,
              note: response.data.note,
            },
          };
        });
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("teacherToken");
        window.location.href = "/teacher/login";
        return;
      }
      console.error(
        "학생 특이사항과 메모를 불러오는 중 오류가 발생했어요.",
        err
      );
    }
  };

  const handleIssueSubmit = async () => {
    if (!selectedStudent || !selectedIssueId) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/issue/assign/${
          selectedStudent.student.id
        }`,
        { issue_description: selectedIssueId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );

      setSelectedIssueId("");
      setModalOpen(false);

      if (selectedSession) {
        const fetchSessionLayout = async () => {
          setLoading(true);
          try {
            const response = await axios.get(
              `${
                import.meta.env.VITE_API_URL
              }/session/${selectedSession}/registrations/${yyyy}/${mm}/${dd}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "teacherToken"
                  )}`,
                },
              }
            );
            setSessionLayout(response.data);
            setError(null);
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              localStorage.removeItem("teacherToken");
              window.location.href = "/teacher/login";
              return;
            }
            setError("야자 신청 현황을 불러오는 중 오류가 발생했어요.");
            console.error(err);
          } finally {
            setLoading(false);
          }
        };
        fetchSessionLayout();
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("teacherToken");
        window.location.href = "/teacher/login";
        return;
      }
      setError("특이사항 할당 중 오류가 발생했어요.");
      console.error(err);
    }
  };

  const handleMemoSubmit = async () => {
    if (!selectedStudent || !memoText.trim()) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/issue/memo/${
          selectedStudent.student.id
        }`,
        { memo: memoText },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );

      setMemoText("");
      setModalOpen(false);

      if (selectedSession) {
        const fetchSessionLayout = async () => {
          setLoading(true);
          try {
            const response = await axios.get(
              `${
                import.meta.env.VITE_API_URL
              }/session/${selectedSession}/registrations/${yyyy}/${mm}/${dd}`,
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "teacherToken"
                  )}`,
                },
              }
            );
            setSessionLayout(response.data);
            console.log(response);
            setError(null);
          } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 401) {
              localStorage.removeItem("teacherToken");
              window.location.href = "/teacher/login";
              return;
            }
            setError("야자 신청 현황을 불러오는 중 오류가 발생했어요.");
            console.error(err);
          } finally {
            setLoading(false);
          }
        };
        fetchSessionLayout();
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("teacherToken");
        window.location.href = "/teacher/login";
        return;
      }
      setError("메모 추가 중 오류가 발생했어요.");
      console.error(err);
    }
  };

  return (
    <div className="layout-container">
      <div className="header">
        <button onClick={() => navigate("/teacher")}>설정</button>
      </div>
      <h2>야자 신청 현황</h2>
      <h3>
        ({yyyy}-{mm}-{dd})
      </h3>

      <div className="session-selector">
        <select
          id="session-select"
          value={selectedSession || ""}
          onChange={handleSessionChange}
          disabled={loading}
        >
          <option value="" disabled>
            야자를 선택하세요
          </option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.name} ({session.start_time.substring(11, 16)} -{" "}
              {session.end_time.substring(11, 16)})
            </option>
          ))}
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading">로딩 중...</div>}

      {selectedSession && !loading && sessionLayout && (
        <div className="session-info">
          <h3>
            {sessions.find((s) => s.id === selectedSession)?.name} (
            {sessions.find((s) => s.id === selectedSession)?.room.name})
          </h3>
          <p>신청 인원: {sessionLayout.registration_count}명</p>

          <SeatLayoutGrid
            sessionLayout={sessionLayout}
            handleStudentClick={handleStudentClick}
          />
        </div>
      )}

      {sessions.length === 0 && !loading && (
        <div className="no-sessions">오늘 등록된 야자가 없습니다.</div>
      )}

      {modalOpen && selectedStudent && (
        <div className="student-modal-overlay">
          <div className="student-modal">
            <h3>학생 정보</h3>
            <p>이름: {selectedStudent.student.name}</p>
            <p>
              학번: {selectedStudent.student.grade}-
              {selectedStudent.student.class}-{selectedStudent.student.number}
            </p>

            <div className="issue-section">
              <h4>특이사항 선택</h4>
              <select
                value={selectedIssueId}
                onChange={(e) => setSelectedIssueId(e.target.value)}
                className="issue-select"
              >
                <option value="">특이사항을 선택하세요</option>
                {issueTypes.map((issue) => (
                  <option key={issue.id} value={issue.description}>
                    {issue.description}
                  </option>
                ))}
              </select>
              <button onClick={handleIssueSubmit} disabled={!selectedIssueId}>
                특이사항 선택
              </button>
            </div>

            <div className="memo-section">
              <h4>메모 작성</h4>
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="메모 내용을 입력하세요"
                rows={3}
              />
              <button onClick={handleMemoSubmit}>메모 저장</button>
            </div>

            <button
              className="close-button"
              onClick={() => setModalOpen(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
