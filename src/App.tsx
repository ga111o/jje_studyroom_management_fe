import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Access from "./teacher/access/Access";
import Layout from "./Layout";
import Register from "./student/Register";
import Settings from "./teacher/Settings";
import Teacher from "./teacher/Teacher";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/teacher/login" element={<Access />} />

        <Route path="/" element={<Layout />} />
        <Route path="/:location/:col_num/:row_num" element={<Register />} />
        <Route path="/teacher/settings" element={<Settings />} />
        <Route path="/teacher" element={<Teacher />} />
      </Routes>
    </Router>
  );
}

export default App;
