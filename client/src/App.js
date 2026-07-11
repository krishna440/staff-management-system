import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import AddStaff from "./pages/AddStaff";
import Login from "./pages/login";
import Chargesheet from "./pages/chargesheet";
import Timetable from "./pages/Timetable";
import Teaching from "./pages/Teaching";
import NonTeaching from "./pages/NonTeaching";
import TaskRates from "./pages/TaskRates";
import ChangePassword from "./pages/ChangePassword";
import AddSubject from "./pages/AddSubject";
import PortalShell from "./components/PortalShell";

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

const PrivateRoute = ({ children }) => {
  return getStoredUser() ? children : <Navigate to="/login" replace />;
};

const PasswordReadyRoute = ({ children }) => {
  const storedUser = getStoredUser();
  if (!storedUser) return <Navigate to="/login" replace />;
  return storedUser.user?.mustChangePassword ? <Navigate to="/change-password" replace /> : children;
};

function App() {
  return (
    <Router>
      <Routes>`r`n        <Route path="/login" element={<Login />} />
        <Route
          path="/change-password"
          element={
            <PrivateRoute>
              <ChangePassword />
            </PrivateRoute>
          }
        />`r`n        <Route
          path="/"
          element={
            <PasswordReadyRoute>
              <Dashboard />
            </PasswordReadyRoute>
          }
        />

        <Route
          path="/add-staff"
          element={
            <PasswordReadyRoute>
              <PortalShell><AddStaff /></PortalShell>
            </PasswordReadyRoute>
          }
        />

        <Route
          path="/chargesheet"
          element={
            <PasswordReadyRoute>
              <PortalShell><Chargesheet /></PortalShell>
            </PasswordReadyRoute>
          }
        />

        <Route
          path="/timetable"
          element={
            <PasswordReadyRoute>
              <PortalShell><Timetable /></PortalShell>
            </PasswordReadyRoute>
          }
        />`r`n        <Route
          path="/teaching"
          element={
            <PasswordReadyRoute>
              <PortalShell><Teaching /></PortalShell>
            </PasswordReadyRoute>
          }
        />

        <Route
          path="/non-teaching"
          element={
            <PasswordReadyRoute>
              <PortalShell><NonTeaching /></PortalShell>
            </PasswordReadyRoute>
          }
        />
        <Route
          path="/task-rates"
          element={
            <PasswordReadyRoute>
              <PortalShell><TaskRates /></PortalShell>
            </PasswordReadyRoute>
          }
        />
        <Route
          path="/add-subject"
          element={
            <PasswordReadyRoute>
              <PortalShell><AddSubject /></PortalShell>
            </PasswordReadyRoute>
          }
        />
        <Route path="*" element={<Navigate to={getStoredUser() ? "/" : "/login"} replace />} />
      </Routes>
      
    </Router>
  );
}

export default App;
