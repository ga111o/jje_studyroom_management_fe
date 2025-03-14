import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Access from "./teacher/access/Access";
import StudyRoomSettings from "./teacher/settings/StudyRoomSettings";
import StudySessionSetting from "./teacher/settings/StudySessionSettings";
import Layout from "./Layout";
import Register from "./student/Register";
import Settings from "./teacher/Settings";
import Teacher from "./teacher/Teacher";

function App() {
  const [count, setCount] = useState(0);

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
