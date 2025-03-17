import React, { useEffect, useState } from "react";
import axios from "axios";
import SeatLayoutGrid, { SessionLayout } from "../SeatLayoutGrid";
import * as XLSX from "xlsx";
import "./Teacher.css";

interface Room {
  id: number;
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
  room: Room;
}

interface StudySessionsResponse {
  study_sessions: StudySession[];
}

interface SessionDate {
  year: string;
  month: string;
  date: string;
}

interface SeatInfo {
  type: "seat" | "aisle";
  id?: string;
  row?: number;
  col?: number;
  occupied?: boolean;
  student?: {
    id: string;
    name: string;
    grade: number;
    class: number;
    number: number;
    student_id: string;
    registered_at: string;
    issue_type: string | null;
    note: string;
    seat_number: string;
  } | null;
}

interface LayoutResponse {
  session_id: string;
  date: string;
  layout: SeatInfo[][];
  registration_count: number;
}

const Teacher: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null
  );
  const [sessionDates, setSessionDates] = useState<SessionDate[]>([]);
  const [loadingDates, setLoadingDates] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<SessionDate | null>(null);
  const [seatLayout, setSeatLayout] = useState<SeatInfo[][] | null>(null);
  const [loadingLayout, setLoadingLayout] = useState<boolean>(false);
  const [layoutResponse, setLayoutResponse] = useState<LayoutResponse | null>(
    null
  );

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/session/`
        );
        if (!response) {
          throw new Error("야자 데이터를 불러오는데 실패했습니다.");
        }
        const data: StudySessionsResponse = response.data;
        setSessions(data.study_sessions);
        console.log(data.study_sessions);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // 학년 정보를 문자열로 변환하는 함수
  const getGradeString = (session: StudySession): string => {
    const grades = [];
    if (session.one_grade) grades.push("1학년");
    if (session.two_grade) grades.push("2학년");
    if (session.three_grade) grades.push("3학년");
    return grades.length > 0 ? grades.join(", ") : "없음";
  };

  // 날짜 및 시간 포맷팅 함수
  const formatDateTime = (dateTimeStr: string): string => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString("ko-KR");
  };

  // 야자 날짜 불러오기 함수
  const fetchSessionDates = async (sessionId: number) => {
    setLoadingDates(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/session/${sessionId}/dates`
      );
      setSessionDates(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "날짜 정보를 불러오는데 실패했습니다."
      );
    } finally {
      setLoadingDates(false);
    }
  };

  // 야자 클릭 핸들러
  const handleSessionClick = (sessionId: number) => {
    if (selectedSessionId === sessionId) {
      // 이미 선택된 야자을 다시 클릭하면 선택 해제
      setSelectedSessionId(null);
      setSessionDates([]);
    } else {
      setSelectedSessionId(sessionId);
      fetchSessionDates(sessionId);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (date: SessionDate): string => {
    return `${date.year}년 ${date.month}월 ${date.date}일`;
  };

  // 날짜 클릭 핸들러
  const handleDateClick = async (date: SessionDate) => {
    if (selectedSessionId === null) return;

    setSelectedDate(date);
    setLoadingLayout(true);

    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }/session/${selectedSessionId}/registrations/${date.year}/${
          date.month
        }/${date.date}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`, // 토큰이 있다면 전송
          },
        }
      );

      console.log(response.data);

      const layoutData: LayoutResponse = response.data;
      setSeatLayout(layoutData.layout);
      console.log(seatLayout);
      setLayoutResponse(layoutData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "좌석 레이아웃을 불러오는데 실패했습니다."
      );
      setSeatLayout(null);
      setLayoutResponse(null);
    } finally {
      setLoadingLayout(false);
    }
  };

  // 학생 클릭 핸들러
  const handleStudentClick = (student: any, registrationId: string) => {
    console.log("학생 정보:", student);
    console.log("등록 ID:", registrationId);
    // 여기에 학생 클릭 시 수행할 작업 추가
  };

  // Excel 다운로드 함수
  const handleExcelDownload = async () => {
    if (!selectedSessionId || !selectedDate) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/session/${selectedSessionId}/users/${
          selectedDate.year
        }/${selectedDate.month}/${selectedDate.date}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );

      const userData = response.data;

      // 엑셀 데이터 준비
      const excelData = [];

      // 헤더 행 추가 (날짜 정보 포함)
      const dateString = `${selectedDate.year}년 ${selectedDate.month}월 ${selectedDate.date}일`;
      excelData.push([
        "날짜",
        "야자",
        "야자 장소",
        "학년",
        "반",
        "번호",
        "이름",
        "좌석번호",
        "등록 시간",
        "특이사항",
        "메모",
      ]);

      // 사용자 데이터를 학년, 반, 번호 순으로 정렬
      const sortedUsers = [...userData.users].sort((a, b) => {
        // 학년 기준 정렬
        if (a.grade !== b.grade) {
          return a.grade - b.grade;
        }
        // 반 기준 정렬
        if (a.class !== b.class) {
          return a.class - b.class;
        }
        // 번호 기준 정렬
        return a.number - b.number;
      });

      // 정렬된 사용자 데이터 추가
      sortedUsers.forEach((user) => {
        excelData.push([
          dateString, // 날짜
          userData.session_name, // 야자 이름
          userData.room.name, // 야자 장소
          user.grade, // 학년
          user.class, // 반
          user.number, // 번호
          user.name, // 이름
          user.seat_number, // 좌석번호
          user.registered_at, // 등록 시간
          user.issue_type || "", // 특이사항
          user.note || "", // 메모
        ]);
      });

      // 워크시트 생성
      const ws = XLSX.utils.aoa_to_sheet(excelData);

      // 워크북 생성
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "좌석 배치");

      // 파일명 생성
      const fileName = `좌석배치_${selectedDate.year}${selectedDate.month}${selectedDate.date}.xlsx`;

      // 엑셀 파일 다운로드
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "엑셀 데이터를 불러오는데 실패했습니다."
      );
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <div className="teacher-dashboard">
      <div className="page-header">
        <div className="page-header-left">
          <h2>야자 관리</h2>{" "}
          <button
            className="settings-button"
            onClick={() => (window.location.href = "/teacher/settings")}
          >
            야자 설정
          </button>
        </div>
        <button
          className="home-button"
          onClick={() => (window.location.href = "/")}
        >
          홈으로 이동
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="no-sessions">
          <i className="fas fa-exclamation-circle"></i>
          <p>등록된 야자가 없습니다.</p>
        </div>
      ) : (
        <div className="dashboard-layout">
          <div className="sessions-container">
            <div className="card">
              <div className="card-header">
                <h3>야자 목록</h3>
                <span className="info-badge">{sessions.length}개</span>
              </div>
              <div className="sessions-table-container">
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>야자</th>
                      <th>시작 시간</th>
                      <th>종료 시간</th>
                      <th>대상 학년</th>
                      <th>신청 가능 시간</th>
                      <th>야자 장소</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr
                        key={session.id}
                        onClick={() => handleSessionClick(session.id)}
                        className={
                          selectedSessionId === session.id ? "selected" : ""
                        }
                      >
                        <td>{session.name}</td>
                        <td>{session.start_time}</td>
                        <td>{session.end_time}</td>
                        <td>{getGradeString(session)}</td>
                        <td>
                          시작 {session.minutes_before}분 전 ~ 시작{" "}
                          {session.minutes_after}분 후
                        </td>
                        <td>
                          <span className="room-badge">
                            {session.room.name}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedSessionId && (
              <div className="card">
                <div className="card-header">
                  <h3>야자 날짜</h3>
                  {!loadingDates && sessionDates.length > 0 && (
                    <span className="info-badge">{sessionDates.length}일</span>
                  )}
                </div>
                <div className="card-content">
                  {loadingDates ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                      <p>날짜 로딩 중...</p>
                    </div>
                  ) : sessionDates.length > 0 ? (
                    <div className="date-grid">
                      {sessionDates.map((date, index) => (
                        <div
                          key={index}
                          onClick={() => handleDateClick(date)}
                          className={`date-item ${
                            selectedDate &&
                            selectedDate.year === date.year &&
                            selectedDate.month === date.month &&
                            selectedDate.date === date.date
                              ? "selected"
                              : ""
                          }`}
                        >
                          {formatDate(date)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>등록된 날짜가 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedDate && (
            <div className="card">
              <div className="card-header">
                <h3>{formatDate(selectedDate)} 좌석 배치</h3>
                {layoutResponse && (
                  <div className="header-actions">
                    <button
                      onClick={handleExcelDownload}
                      className="primary-button"
                    >
                      엑셀로 다운로드
                    </button>
                    <div className="registration-count">
                      등록 인원:{" "}
                      <strong>{layoutResponse.registration_count}명</strong>
                    </div>
                  </div>
                )}
              </div>
              <div className="card-content">
                {loadingLayout ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>좌석 레이아웃 로딩 중...</p>
                  </div>
                ) : layoutResponse ? (
                  <div className="layout-grid-container">
                    <SeatLayoutGrid
                      sessionLayout={layoutResponse as SessionLayout}
                      handleStudentClick={handleStudentClick}
                    />
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>좌석 레이아웃을 불러올 수 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Teacher;
