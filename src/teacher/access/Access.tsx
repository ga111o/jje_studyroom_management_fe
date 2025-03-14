import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Access = () => {
  const [accessKey, setAccessKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/`,
        { key: accessKey }
      );

      console.log(response.data);

      localStorage.setItem("teacherToken", response.data.token);

      navigate("/teacher/");
    } catch (err) {
      setError("Access key가 올바르지 않아요. 다시 확인해주세요.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="access-container">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="accessKey">야자 관리 선생님 Access key</label>
          <input
            type="password"
            id="accessKey"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
};

export default Access;
