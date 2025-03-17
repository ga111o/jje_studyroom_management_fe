import React, { useEffect, useState } from "react";
import axios from "axios";
import SeatLayoutGrid, { SessionLayout } from "../SeatLayoutGrid";
import * as XLSX from "xlsx";

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
    <div>
      <h1>야자 목록</h1>
      {sessions.length === 0 ? (
        <p>등록된 야자이 없습니다.</p>
      ) : (
        <div>
          <table>
            <thead>
              <tr>
                <th>야자</th>
                <th>시작 시간</th>
                <th>종료 시간</th>
                <th>대상 학년</th>
                <th>신청 가능 시간(시작 전 n분부터)</th>
                <th>신청 가능 시간(시작 후 n분까지)</th>
                <th>야자 장소</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.id}
                  onClick={() => handleSessionClick(session.id)}
                  style={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedSessionId === session.id
                        ? "#f0f0f0"
                        : "transparent",
                  }}
                >
                  <td>{session.name}</td>
                  <td>{formatDateTime(session.start_time)}</td>
                  <td>{formatDateTime(session.end_time)}</td>
                  <td>{getGradeString(session)}</td>
                  <td>{session.minutes_before}</td>
                  <td>{session.minutes_after}</td>
                  <td>{session.room.name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedSessionId && (
            <div className="session-dates">
              <h2>야자 날짜</h2>
              {loadingDates ? (
                <p>날짜 로딩 중...</p>
              ) : sessionDates.length > 0 ? (
                <ul>
                  {sessionDates.map((date, index) => (
                    <li
                      key={index}
                      onClick={() => handleDateClick(date)}
                      style={{
                        cursor: "pointer",
                        fontWeight:
                          selectedDate &&
                          selectedDate.year === date.year &&
                          selectedDate.month === date.month &&
                          selectedDate.date === date.date
                            ? "bold"
                            : "normal",
                        backgroundColor:
                          selectedDate &&
                          selectedDate.year === date.year &&
                          selectedDate.month === date.month &&
                          selectedDate.date === date.date
                            ? "#e0e0e0"
                            : "transparent",
                      }}
                    >
                      {formatDate(date)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>등록된 날짜가 없습니다.</p>
              )}
            </div>
          )}

          {selectedDate && (
            <div className="layout-container">
              <h2>{formatDate(selectedDate)} 좌석 배치</h2>
              {loadingLayout ? (
                <p>좌석 레이아웃 로딩 중...</p>
              ) : layoutResponse ? (
                <>
                  <div className="layout-actions">
                    <button
                      onClick={handleExcelDownload}
                      className="excel-download-btn"
                    >
                      엑셀로 다운로드
                    </button>
                  </div>
                  <SeatLayoutGrid
                    sessionLayout={layoutResponse as SessionLayout}
                    handleStudentClick={handleStudentClick}
                  />
                </>
              ) : (
                <p>좌석 레이아웃을 불러올 수 없습니다.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Teacher;
