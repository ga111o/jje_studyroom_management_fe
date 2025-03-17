import React from "react";
import "./seatLayout.css";

export interface Student {
  id: string;
  name: string;
  grade: number;
  class: number;
  number: number;
  issue_type?: string;
  note?: string;
}

export interface Room {
  id: string;
  name: string;
}

interface Seat {
  type: "seat";
  id: string;
  row: number;
  col: number;
  student?: Student;
}

interface Aisle {
  type: "aisle";
}

type GridCell = Seat | Aisle;

export interface SessionLayout {
  layout: GridCell[][];
  date: string;
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
    <div className="seat-layout-container">
      <table className="seat-layout-table">
        <tbody>
          {sessionLayout.layout.map((row, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {row.map((cell, colIndex) => {
                if (cell.type === "aisle") {
                  return (
                    <td
                      key={`aisle-${rowIndex}-${colIndex}`}
                      className="aisle-cell"
                    ></td>
                  );
                } else {
                  const seat = cell as Seat;
                  const isOccupied = !!seat.student;

                  return (
                    <td
                      key={`seat-${seat.id}`}
                      className={`seat-cell ${
                        isOccupied ? "occupied" : "empty"
                      }`}
                      onClick={() => {
                        if (isOccupied && seat.student) {
                          handleStudentClick(seat.student, seat.id);
                        }
                      }}
                    >
                      <div className="seat-content">
                        <div className="seat-id">{seat.id}</div>
                        {isOccupied && seat.student && (
                          <>
                            <div className="student-name">
                              {seat.student.name}
                            </div>
                            <div className="student-id">
                              {seat.student.grade}-{seat.student.class}-
                              {seat.student.number}
                            </div>

                            {seat.student.issue_type && (
                              <div className="student-issue">
                                <span>{seat.student.issue_type}</span>
                              </div>
                            )}
                            {seat.student.note && (
                              <div className="student-note">
                                <span>{seat.student.note}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  );
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SeatLayoutGrid;
