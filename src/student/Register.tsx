import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./Register.css";

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
  room: {
    id: number;
    name: string;
  };
}

interface RegistrationFormData {
  name: string;
  grade: number;
  class_number: number;
  student_number: number;
  session_id: string;
  seat_row: string;
  seat_col: string;
}

const Register = () => {
  const { location, col_num, row_num } = useParams<{
    location: string;
    col_num: string;
    row_num: string;
  }>();

  const [studentInfo, setStudentInfo] = useState({
    name: "",
    grade: 1,
    class_number: 1,
    student_number: 1,
  });

  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<StudySession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");

  const [formData, setFormData] = useState<RegistrationFormData>({
    name: "",
    grade: 1,
    class_number: 1,
    student_number: 1,
    session_id: "",
    seat_row: row_num || "",
    seat_col: col_num || "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    const savedStudentInfo = localStorage.getItem("studentInfo");
    if (savedStudentInfo) {
      const parsedInfo = JSON.parse(savedStudentInfo);
      setStudentInfo(parsedInfo);

      setFormData((prevData) => ({
        ...prevData,
        name: parsedInfo.name,
        grade: parsedInfo.grade,
        class_number: parsedInfo.class_number,
        student_number: parsedInfo.student_number,
      }));

      // Filter sessions based on the loaded student info and move to step 2
      const filtered = sessions.filter((session) => {
        if (location && session.room.id !== parseInt(location, 10)) {
          return false;
        }

        switch (parsedInfo.grade) {
          case 1:
            return session.one_grade;
          case 2:
            return session.two_grade;
          case 3:
            return session.three_grade;
          default:
            return false;
        }
      });

      setFilteredSessions(filtered);
      setStep(2);
    }
  }, [sessions, location]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/session/`
        );
        setSessions(response.data.study_sessions);
        console.log(response.data.study_sessions);
      } catch (err) {
        console.error("야자 데이터 가져오기 실패:", err);
        setError("야자 정보를 불러오는데 실패했습니다.");
      }
    };

    fetchSessions();
  }, []);

  const handleStudentInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (["grade", "class_number", "student_number"].includes(name)) {
      setStudentInfo({
        ...studentInfo,
        [name]: parseInt(value, 10) || 0,
      });
    } else {
      setStudentInfo({
        ...studentInfo,
        [name]: value,
      });
    }
  };

  const handleStudentInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    localStorage.setItem("studentInfo", JSON.stringify(studentInfo));

    setFormData({
      ...formData,
      name: studentInfo.name,
      grade: studentInfo.grade,
      class_number: studentInfo.class_number,
      student_number: studentInfo.student_number,
    });

    const filtered = sessions.filter((session) => {
      console.log("location", location);
      console.log("session.room.id", session.room.id);
      if (location && session.room.id !== parseInt(location, 10)) {
        return false;
      }

      switch (studentInfo.grade) {
        case 1:
          return session.one_grade;
        case 2:
          return session.two_grade;
        case 3:
          return session.three_grade;
        default:
          return false;
      }
    });

    setFilteredSessions(filtered);
    setStep(2);
  };

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSession(e.target.value);
    setFormData({
      ...formData,
      session_id: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const reformattedData = {
        name: formData.name,
        grade: formData.grade,
        class_number: formData.class_number,
        student_number: formData.student_number,
        session_id: formData.session_id,
        seat_row: formData.seat_row,
        seat_col: formData.seat_col,
      };
      console.log("reformattedData", reformattedData);
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/registration/`,
        reformattedData
      );
      setSuccess("야자 신청이 완료되었습니다!");
      console.log("등록 성공:", response.data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.detail || "신청 중 오류가 발생했습니다.");
      } else {
        setError("서버 연결에 실패했습니다.");
      }
      console.error("등록 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStudentInfoForm = () => (
    <form onSubmit={handleStudentInfoSubmit} className="student-form">
      <div className="form-group">
        <label className="form-label" htmlFor="name">
          이름
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={studentInfo.name}
          onChange={handleStudentInfoChange}
          className="form-input"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="grade">
            학년
          </label>
          <select
            id="grade"
            name="grade"
            value={studentInfo.grade}
            onChange={handleStudentInfoChange}
            className="form-select"
            required
          >
            <option value={1}>1학년</option>
            <option value={2}>2학년</option>
            <option value={3}>3학년</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="class_number">
            반
          </label>
          <input
            type="number"
            id="class_number"
            name="class_number"
            min={1}
            max={20}
            value={studentInfo.class_number}
            onChange={handleStudentInfoChange}
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="student_number">
            번호
          </label>
          <input
            type="number"
            id="student_number"
            name="student_number"
            min={1}
            max={40}
            value={studentInfo.student_number}
            onChange={handleStudentInfoChange}
            className="form-input"
            required
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary">
        다음
      </button>
    </form>
  );

  const renderSessionSelectionForm = () => (
    <form onSubmit={handleSubmit} className="session-form">
      <div className="form-group">
        <p className="student-info">
          {studentInfo.grade}학년 {studentInfo.class_number}반{" "}
          {studentInfo.student_number}번 {studentInfo.name}
        </p>

        <label className="form-label" htmlFor="session_id">
          신청 야자 선택
        </label>

        {filteredSessions.length > 0 ? (
          <select
            id="session_id"
            name="session_id"
            value={selectedSession}
            onChange={handleSessionChange}
            className="form-select"
            required
          >
            <option value="">야자를 선택하세요</option>
            {filteredSessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name} ({session.start_time} - {session.end_time})
              </option>
            ))}
          </select>
        ) : (
          <p className="no-sessions-message">이용 가능한 야자가 없습니다.</p>
        )}
      </div>

      <div className="form-buttons">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="btn btn-secondary"
        >
          정보 수정하기
        </button>

        <button
          type="submit"
          disabled={loading || !selectedSession}
          className={`btn btn-primary ${
            loading || !selectedSession ? "btn-disabled" : ""
          }`}
        >
          {loading ? "신청 중..." : "야자 신청하기"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="register-container">
      <h2 className="page-title">야자 신청</h2>

      {error && <div className="alert alert-error">{error}</div>}

      {success && <div className="alert alert-success">{success}</div>}

      <div className="form-card">
        <div className="form-progress">
          <div
            className={`progress-step ${step === 1 ? "active" : "completed"}`}
          >
            1. 학생 정보
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${step === 2 ? "active" : ""}`}>
            2. 야자 선택
          </div>
        </div>

        {step === 1 ? renderStudentInfoForm() : renderSessionSelectionForm()}
      </div>

      <div className="home-button-container">
        <a href="/" className="btn btn-secondary home-button">
          홈으로 이동
        </a>
      </div>
    </div>
  );
};

export default Register;
