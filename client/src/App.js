import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import AddStaff from "./pages/AddStaff";
import Login from "./pages/login";
import Chargesheet from "./pages/chargesheet";
import Timetable from "./pages/Timetable";
import Teaching from "./pages/Teaching";
import NonTeaching from "./pages/NonTeaching";
import Accounts from "./pages/Accounts";
import TaskRates from "./pages/TaskRates";

const getStoredUser = () => {
  try {
    const session = JSON.parse(sessionStorage.getItem("user") || "null");
    return session?.user?.id && session?.user?.role ? session : null;
  } catch {
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    return null;
  }
};

const getUserRole = () => (getStoredUser()?.user?.role || "").toUpperCase();

const PrivateRoute = ({ children }) => {
  return getStoredUser() ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ roles, children }) => {
  if (!getStoredUser()) return <Navigate to="/login" replace />;
  return roles.includes(getUserRole()) ? children : <Navigate to="/" replace />;
};


function App() {
  return (
    <Router>
      <Routes>

        {/* ðŸ”“ Public */}
        <Route path="/login" element={<Login />} />

        {/* ðŸ”’ Protected Routes */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/add-staff"
          element={
            <PrivateRoute>
              <AddStaff />
            </PrivateRoute>
          }
        />

        <Route
          path="/chargesheet"
          element={
            <PrivateRoute>
              <Chargesheet />
            </PrivateRoute>
          }
        />

        <Route
          path="/timetable"
          element={
            <PrivateRoute>
              <Timetable />
            </PrivateRoute>
          }
        />

        {/* âœ… Sidebar Pages */}
        <Route
          path="/teaching"
          element={
            <PrivateRoute>
              <Teaching />
            </PrivateRoute>
          }
        />

        <Route
          path="/non-teaching"
          element={
            <PrivateRoute>
              <NonTeaching />
            </PrivateRoute>
          }
        />
<Route
  path="/accounts"
  element={
    <RoleRoute roles={["ACCOUNTS"]}>
      <Accounts />
    </RoleRoute>
  }
/>
        <Route
          path="/task-rates"
          element={
            <RoleRoute roles={["ADMIN", "HOD"]}>
              <TaskRates />
            </RoleRoute>
          }
        />
        <Route path="*" element={<Navigate to={getStoredUser() ? "/" : "/login"} replace />} />
      </Routes>
      
    </Router>
  );
}

export default App;
