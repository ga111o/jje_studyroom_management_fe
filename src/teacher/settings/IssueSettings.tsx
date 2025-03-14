import React, { useState, useEffect } from "react";
import axios from "axios";

interface IssueType {
  id: string;
  description: string;
}

interface IssueTypeFormData {
  description: string;
}

const Issue: React.FC = () => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ description: "" });
  };

  return (
    <div>
      <h1>특이사항 목록 관리</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={editingId ? handleUpdateIssueType : handleCreateIssueType}
      >
        <div>
          <label htmlFor="description">특이사항 목록:</label>
          <input
            type="text"
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          {editingId ? (
            <>
              <button type="submit" disabled={loading}>
                {loading ? "처리 중..." : "수정"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
              >
                취소
              </button>
            </>
          ) : (
            <button type="submit" disabled={loading}>
              {loading ? "처리 중..." : "생성"}
            </button>
          )}
        </div>
      </form>

      <h2>특이사항 목록 목록</h2>

      {loading && !editingId ? (
        <p>로딩 중...</p>
      ) : (
        <table>
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
                <td colSpan={3}>등록된 특이사항 목록이 없습니다.</td>
              </tr>
            ) : (
              issueTypes.map((issueType) => (
                <tr key={issueType.id}>
                  <td>{issueType.id}</td>
                  <td>{issueType.description}</td>
                  <td>
                    <button
                      onClick={() => handleEditMode(issueType)}
                      disabled={loading}
                    >
                      수정
                    </button>
                    <button
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
      )}
    </div>
  );
};

export default Issue;
