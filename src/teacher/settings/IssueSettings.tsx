import React, { useState, useEffect } from "react";
import axios from "axios";
import "./IssueSettings.css";

interface IssueType {
  id: string;
  description: string;
}

interface IssueTypeFormData {
  description: string;
}

const IssueSettings: React.FC = () => {
  const [issueTypes, setIssueTypes] = useState<IssueType[]>([]);
  const [formData, setFormData] = useState<IssueTypeFormData>({
    description: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIssueTypes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/issue/`
      );
      setIssueTypes(response.data);
      setError(null);
    } catch (err) {
      setError("특이사항 목록을 불러오는데 실패했습니다.");
      console.error(err);

      // 401 Unauthorized 에러 처리
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token"); // 토큰 삭제
        window.location.href = "/teacher/login"; // 로그인 페이지로 리다이렉트
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueTypes();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCreateIssueType = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      setError("특이사항 목록을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/issue/`, formData);
      setFormData({ description: "" });
      fetchIssueTypes();
      setError(null);
    } catch (err) {
      setError("특이사항 목록 생성에 실패했습니다.");
      console.error(err);

      // 401 Unauthorized 에러 처리
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/teacher/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditMode = (issueType: IssueType) => {
    setEditingId(issueType.id);
    setFormData({ description: issueType.description });
  };

  const handleUpdateIssueType = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.description.trim() || !editingId) {
      setError("특이사항 목록을 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_API_URL}/issue/${editingId}`,
        formData
      );
      setFormData({ description: "" });
      setEditingId(null);
      fetchIssueTypes();
      setError(null);
    } catch (err) {
      setError("특이사항 목록 수정에 실패했습니다.");
      console.error(err);

      // 401 Unauthorized 에러 처리
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/teacher/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIssueType = async (id: string) => {
    if (!window.confirm("정말로 이 특이사항 목록을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${import.meta.env.VITE_API_URL}/issue/${id}`);
      fetchIssueTypes();
      setError(null);
    } catch (err) {
      setError("특이사항 목록 삭제에 실패했습니다.");
      console.error(err);

      // 401 Unauthorized 에러 처리
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/teacher/login";
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ description: "" });
  };

  return (
    <div className="issue-settings-container">
      <div className="issue-settings-header">
        <h3>특이사항 목록 관리</h3>
        <p className="settings-description">
          학생들의 특이사항을 추가, 수정, 삭제할 수 있습니다.
        </p>
      </div>

      {error && <div className="issue-error-message">{error}</div>}

      <div className="issue-form-section">
        <form
          className="issue-form"
          onSubmit={editingId ? handleUpdateIssueType : handleCreateIssueType}
        >
          <div className="issue-form-group">
            <label htmlFor="description">특이사항 목록</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              className="issue-input"
              placeholder="새 특이사항을 입력하세요"
            />
          </div>

          <div className="issue-form-actions">
            {editingId ? (
              <>
                <button
                  type="submit"
                  className="issue-btn issue-btn-primary"
                  disabled={loading}
                >
                  {loading ? "처리 중..." : "수정"}
                </button>
                <button
                  type="button"
                  className="issue-btn issue-btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  취소
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="issue-btn issue-btn-primary"
                disabled={loading}
              >
                {loading ? "처리 중..." : "생성"}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="issue-list-section">
        <h4>특이사항 목록</h4>

        {loading && !editingId ? (
          <div className="issue-loading">로딩 중...</div>
        ) : (
          <div className="issue-table-container">
            <table className="issue-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>설명</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {issueTypes.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="issue-empty-message">
                      등록된 특이사항 목록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  issueTypes.map((issueType) => (
                    <tr key={issueType.id}>
                      <td>{issueType.id}</td>
                      <td>{issueType.description}</td>
                      <td className="issue-actions">
                        <button
                          className="issue-btn issue-btn-edit"
                          onClick={() => handleEditMode(issueType)}
                          disabled={loading}
                        >
                          수정
                        </button>
                        <button
                          className="issue-btn issue-btn-delete"
                          onClick={() => handleDeleteIssueType(issueType.id)}
                          disabled={loading}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueSettings;
