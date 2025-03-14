import React from "react";
import "./layout.css";

interface Room {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  grade: string;
  class: string;
  number: string;
  student_id: string;
  registered_at: string;
  note: string | null;
  issue_type: string | null;
}

interface Seat {
  type: "seat";
  id: string;
  row: number;
  col: number;
  occupied: boolean;
  student: Student | null;
}

interface Aisle {
  type: "aisle";
}

type SeatOrAisle = Seat | Aisle;

interface SessionLayout {
  session_id: string;
  date: string;
  layout: SeatOrAisle[][];
  registration_count: number;
}

interface SeatLayoutGridProps {
  sessionLayout: SessionLayout;
  handleStudentClick: (student: Student, registrationId: string) => void;
}

const SeatLayoutGrid: React.FC<SeatLayoutGridProps> = ({
  sessionLayout,
  handleStudentClick,
}) => {
  return (
    <div className="seat-layout">
      <table className="layout-table">
        <tbody>
          {sessionLayout.layout.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`} className="layout-row">
              {row.map((seat, colIndex) => (
                <td
                  key={`seat-${rowIndex}-${colIndex}`}
                  className={`
                    layout-cell 
                    ${seat.type === "aisle" ? "aisle" : "seat"} 
                    ${seat.type === "seat" && seat.occupied ? "occupied" : ""}
                  `}
                  onClick={() =>
                    seat.type === "seat" &&
                    seat.occupied &&
                    seat.student &&
                    seat.student.id &&
                    handleStudentClick(seat.student, seat.id)
                  }
                  style={{
                    cursor:
                      seat.type === "seat" &&
                      seat.occupied &&
                      seat.student &&
                      seat.student.id
                        ? "pointer"
                        : "default",
                  }}
                >
                  {seat.type === "seat" && (
                    <>
                      <div className="seat-id">{seat.id}</div>
                      {seat.occupied && seat.student && (
                        <div className="student-info">
                          <div>
                            {seat.student.grade &&
                            seat.student.class &&
                            seat.student.number
                              ? `${seat.student.grade}-${seat.student.class}-${seat.student.number}`
                              : ""}{" "}
                            {seat.student.name || ""}
                          </div>
                          <div>{seat.student.issue_type || ""}</div>
                          <div>{seat.student.note || ""}</div>
                        </div>
                      )}
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SeatLayoutGrid;
export type { SessionLayout, Student, Room, Seat, Aisle, SeatOrAisle };
