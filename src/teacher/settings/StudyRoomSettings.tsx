import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { createRoot } from "react-dom/client";

interface Studyroom {
  id: string;
  name: string;
  layout: string[][];
}

const StudyRoomSettings = () => {
  const [studyrooms, setStudyrooms] = useState<Studyroom[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [editingRoom, setEditingRoom] = useState<Studyroom | null>(null);
  const [error, setError] = useState("");
  const [customLayout, setCustomLayout] = useState<string[][]>([
    ["1", "2", "3", "", "4", "5", "6"],
    ["7", "8", "9", "", "10", "11", "12"],
    ["", "", "", "", "", "", ""],
    ["13", "14", "15", "", "16", "17", "18"],
    ["19", "20", "21", "", "22", "23", "24"],
  ]);
  const [rows, setRows] = useState(5);
  const [cols, setColumns] = useState(7);
  const [downloadingRoomId, setDownloadingRoomId] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/studyroom`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
    },
  });

  const generateQRCodeUrl = (
    roomId: string,
    colIndex: number,
    rowIndex: number
  ) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/${roomId}/${colIndex}/${rowIndex}`;
  };

  const generateQRCodeCanvas = async (url: string, label: string) => {
    return new Promise<HTMLCanvasElement>((resolve) => {
      const tempDiv = document.createElement("div");
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);

      const qrElement = document.createElement("div");
      tempDiv.appendChild(qrElement);

      const root = createRoot(qrElement);
      root.render(<QRCodeSVG value={url} size={128} />);

      setTimeout(() => {
        const svgElement = qrElement.querySelector("svg");
        if (!svgElement) {
          document.body.removeChild(tempDiv);
          console.error("SVG element not found");
          return;
        }

        const svgData = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
        const svgUrl = URL.createObjectURL(svgBlob);

        const finalCanvas = document.createElement("canvas");
        finalCanvas.width = 200;
        finalCanvas.height = 170;
        const finalCtx = finalCanvas.getContext("2d");

        if (finalCtx) {
          finalCtx.fillStyle = "white";
          finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

          const img = new Image();
          img.onload = () => {
            finalCtx.drawImage(img, 36, 10, 128, 128);
            finalCtx.font = "12px Arial";
            finalCtx.textAlign = "center";
            finalCtx.fillStyle = "black";
            finalCtx.fillText(label, finalCanvas.width / 2, 155);

            document.body.removeChild(tempDiv);
            URL.revokeObjectURL(svgUrl);

            resolve(finalCanvas);
          };

          img.src = svgUrl;
        } else {
          document.body.removeChild(tempDiv);
          URL.revokeObjectURL(svgUrl);
        }
      }, 100);
    });
  };

  const downloadAllQRCodes = async (room: Studyroom) => {
    try {
      setDownloadingRoomId(room.id);
      console.log(room);
      const zip = new JSZip();
      const folder = zip.folder(room.name);

      if (!folder) return;

      for (let rowIndex = 0; rowIndex < room.layout.length; rowIndex++) {
        for (
          let colIndex = 0;
          colIndex < room.layout[rowIndex].length;
          colIndex++
        ) {
          const seat = room.layout[rowIndex][colIndex];

          if (seat !== "aisle" && seat.trim() !== "") {
            const qrUrl = generateQRCodeUrl(room.id, colIndex, rowIndex);
            const label = `${room.name} - 좌석 ${seat}`;

            try {
              const canvas = await generateQRCodeCanvas(qrUrl, label);

              const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((b) => {
                  if (b) resolve(b);
                }, "image/png");
              });

              folder.file(`${room.name} - ${seat}.png`, blob);
            } catch (error) {
              console.error(`QR 코드 생성 실패: ${error}`);
            }
          }
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${room.name}_QRCodes.zip`);
    } catch (error) {
      console.error(`QR 코드 다운로드 실패: ${error}`);
    } finally {
      setDownloadingRoomId(null);
    }
  };

  const fetchStudyrooms = async () => {
    try {
      console.log(localStorage.getItem("teacherToken"));
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/studyroom/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("teacherToken")}`,
          },
        }
      );
      const data = await response.json();
      setStudyrooms(data.studyrooms);
    } catch (err) {
      setError("야자실 목록을 불러오는데 실패했습니다.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudyrooms();
  }, []);

  const createStudyroom = async () => {
    if (!newRoomName.trim()) {
      setError("야자실 이름을 입력해주세요.");
      return;
    }

    try {
      console.log(customLayout);
      const layoutForBackend = customLayout.map((row) =>
        row.map((cell) => (cell.trim() === "" ? "aisle" : cell))
      );

      await api.post("/", {
        name: newRoomName,
        layout: layoutForBackend,
      });

      setNewRoomName("");
      fetchStudyrooms();
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "야자실 생성에 실패했습니다.");
      console.error(err);
    }
  };

  const updateStudyroom = async () => {
    if (!editingRoom) return;

    try {
      const layoutForBackend = customLayout.map((row) =>
        row.map((cell) => (cell.trim() === "" ? "aisle" : cell))
      );

      await api.put(`/${editingRoom.id}`, {
        name: editingRoom.name,
        layout: layoutForBackend,
      });

      setEditingRoom(null);
      fetchStudyrooms();
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "야자실 수정에 실패했습니다.");
      console.error(err);
    }
  };

  const deleteStudyroom = async (id: string) => {
    if (!window.confirm("정말로 이 야자실을 삭제하시겠습니까?")) return;

    try {
      await api.delete(`/${id}`);
      fetchStudyrooms();
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.detail || "야자실 삭제에 실패했습니다.");
      console.error(err);
    }
  };

  const updateLayoutCell = (
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const newLayout = [...customLayout];
    newLayout[rowIndex][colIndex] = value;
    setCustomLayout(newLayout);
  };

  const resizeLayout = () => {
    const newLayout: string[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: string[] = [];
      for (let j = 0; j < cols; j++) {
        row.push(customLayout[i]?.[j] || "");
      }
      newLayout.push(row);
    }
    setCustomLayout(newLayout);
  };

  const addRow = () => {
    const newRow = Array(cols).fill("");
    setCustomLayout([...customLayout, newRow]);
    setRows(rows + 1);
  };

  const removeRow = () => {
    if (rows <= 1) return;
    const newLayout = customLayout.slice(0, -1);
    setCustomLayout(newLayout);
    setRows(rows - 1);
  };

  const addColumn = () => {
    const newLayout = customLayout.map((row) => [...row, ""]);
    setCustomLayout(newLayout);
    setColumns(cols + 1);
  };

  const removeColumn = () => {
    if (cols <= 1) return;
    const newLayout = customLayout.map((row) => row.slice(0, -1));
    setCustomLayout(newLayout);
    setColumns(cols - 1);
  };

  const startEditing = (room: Studyroom) => {
    const displayLayout = room.layout.map((row) =>
      row.map((cell) => (cell === "aisle" ? "" : cell))
    );

    setEditingRoom({ ...room });
    setCustomLayout(displayLayout);
    setRows(displayLayout.length);
    setColumns(displayLayout[0].length);
  };

  useEffect(() => {
    if (studyrooms.length > 0 && !editingRoom) {
      const defaultLayout = customLayout.map((row) =>
        row.map((cell) => (cell === "aisle" ? "" : cell))
      );
      setCustomLayout(defaultLayout);
    }
  }, [studyrooms]);

  return (
    <div className="settings-container">
      <h1>야자실 관리</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="create-form">
        <h2>새 야자실 추가</h2>
        <div className="form-group">
          <input
            type="text"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            placeholder="야자실 이름"
          />
        </div>

        <div className="layout-size-controls">
          <div className="form-group">
            <label>행 수:</label>
            <input
              type="number"
              min="1"
              value={rows}
              onChange={(e) =>
                setRows(Math.max(1, parseInt(e.target.value) || 1))
              }
            />
            <div className="row-controls">
              <button type="button" onClick={addRow}>
                +
              </button>
              <button type="button" onClick={removeRow} disabled={rows <= 1}>
                -
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>열 수:</label>
            <input
              type="number"
              min="1"
              value={cols}
              onChange={(e) =>
                setColumns(Math.max(1, parseInt(e.target.value) || 1))
              }
            />
            <div className="column-controls">
              <button type="button" onClick={addColumn}>
                +
              </button>
              <button type="button" onClick={removeColumn} disabled={cols <= 1}>
                -
              </button>
            </div>
          </div>
          <button onClick={resizeLayout}>크기 조정</button>
        </div>

        <div className="layout-editor">
          <h3>레이아웃 설정</h3>
          <p>좌석 번호를 입력해주세요. 통로는 빈칸으로 두세요.</p>
          <table className="layout-table">
            <tbody>
              {customLayout.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex}>
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) =>
                          updateLayoutCell(rowIndex, colIndex, e.target.value)
                        }
                        placeholder="통로"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={createStudyroom}>추가</button>
      </div>

      <div className="studyroom-list">
        <h2>야자실 목록</h2>
        {studyrooms.length === 0 ? (
          <p>등록된 야자실이 없습니다.</p>
        ) : (
          <ul>
            {studyrooms.map((room) => (
              <li key={room.id}>
                {editingRoom && editingRoom.id === room.id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editingRoom.name}
                      onChange={(e) =>
                        setEditingRoom({ ...editingRoom, name: e.target.value })
                      }
                    />

                    <div className="layout-editor">
                      <h3>레이아웃 수정</h3>
                      <div className="layout-size-controls">
                        <div className="form-group">
                          <label>행 수:</label>
                          <input
                            type="number"
                            min="1"
                            value={rows}
                            onChange={(e) =>
                              setRows(
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                          />
                          <div className="row-controls">
                            <button type="button" onClick={addRow}>
                              +
                            </button>
                            <button
                              type="button"
                              onClick={removeRow}
                              disabled={rows <= 1}
                            >
                              -
                            </button>
                          </div>
                        </div>
                        <div className="form-group">
                          <label>열 수:</label>
                          <input
                            type="number"
                            min="1"
                            value={cols}
                            onChange={(e) =>
                              setColumns(
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                          />
                          <div className="column-controls">
                            <button type="button" onClick={addColumn}>
                              +
                            </button>
                            <button
                              type="button"
                              onClick={removeColumn}
                              disabled={cols <= 1}
                            >
                              -
                            </button>
                          </div>
                        </div>
                        <button onClick={resizeLayout}>크기 조정</button>
                      </div>

                      <table className="layout-table">
                        <tbody>
                          {customLayout.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {row.map((cell, colIndex) => (
                                <td key={colIndex}>
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) =>
                                      updateLayoutCell(
                                        rowIndex,
                                        colIndex,
                                        e.target.value
                                      )
                                    }
                                    placeholder="통로"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={() => {
                        setEditingRoom({
                          ...editingRoom,
                          layout: customLayout,
                        });
                        updateStudyroom();
                      }}
                    >
                      저장
                    </button>
                    <button onClick={() => setEditingRoom(null)}>취소</button>
                  </div>
                ) : (
                  <div className="room-item">
                    <span>{room.name}</span>
                    <div className="actions">
                      <button onClick={() => startEditing(room)}>수정</button>
                      <button onClick={() => deleteStudyroom(room.id)}>
                        삭제
                      </button>
                      <button
                        onClick={() => downloadAllQRCodes(room)}
                        disabled={downloadingRoomId === room.id}
                      >
                        {downloadingRoomId === room.id
                          ? "QR 코드 생성 중..."
                          : "모든 QR 코드 다운로드"}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudyRoomSettings;
