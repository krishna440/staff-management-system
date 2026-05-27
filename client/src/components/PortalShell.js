import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ label: "Overview", path: "/", roles: ["ADMIN", "HOD", "ACCOUNTS"] }],
  },
  {
    label: "Staff",
    roles: ["ADMIN", "HOD"],
    items: [
      { label: "Teaching", path: "/teaching", roles: ["ADMIN", "HOD"] },
      { label: "Non-Teaching", path: "/non-teaching", roles: ["ADMIN", "HOD"] },
    ],
  },
  {
    label: "Chargesheet",
    items: [
      { label: "Create Chargesheet", path: "/chargesheet", roles: ["ADMIN", "HOD"] },
      { label: "Add Subject", path: "/add-subject", roles: ["ADMIN", "HOD"] },
      { label: "Add Staff", path: "/add-staff", roles: ["ADMIN", "HOD"] },
      { label: "Task Rates", path: "/task-rates", roles: ["ADMIN", "HOD"] },
      { label: "Create Timetable", path: "/timetable", roles: ["ADMIN", "HOD"] },
      { label: "Accounts Section", path: "/accounts", roles: ["ACCOUNTS"] },
    ],
  },
];

function readUser() {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export default function PortalShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = readUser();
  const userRole = (user?.user?.role || "").toUpperCase() || "USER";
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("portal_sidebar_collapsed") === "1");

  const isVisible = (roles) => !roles || roles.includes(userRole);
  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("portal_sidebar_collapsed", next ? "1" : "0");
  };
  const logout = () => {
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className={`portal-shell ${collapsed ? "portal-shell-collapsed" : ""}`}>
      <style>{`
        .portal-shell { min-height: 100vh; display: flex; background: #f0f2f8; }
        .portal-sidebar {
          width: 248px; min-width: 248px; background: #0b1120; color: #fff;
          display: flex; flex-direction: column; transition: width .2s ease, min-width .2s ease;
          position: sticky; top: 0; height: 100vh; z-index: 50; overflow: hidden;
        }
        .portal-shell-collapsed .portal-sidebar { width: 72px; min-width: 72px; }
        .portal-sidebar-head { padding: 18px 16px; border-bottom: 1px solid rgba(255,255,255,.08); display: flex; align-items: center; gap: 12px; }
        .portal-logo { width: 42px; height: 42px; border-radius: 10px; background: #fff; padding: 4px; object-fit: contain; flex-shrink: 0; }
        .portal-brand { min-width: 0; }
        .portal-brand-title { font-size: 14px; font-weight: 800; color: #fff; }
        .portal-brand-sub { font-size: 10px; color: rgba(255,255,255,.46); text-transform: uppercase; letter-spacing: .08em; margin-top: 3px; }
        .portal-shell-collapsed .portal-brand { display: none; }
        .portal-toggle {
          margin-left: auto; width: 30px; height: 30px; border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.06);
          color: #dbeafe; border-radius: 8px; cursor: pointer; font-size: 16px; line-height: 1;
        }
        .portal-shell-collapsed .portal-toggle { margin-left: 0; }
        .portal-nav { padding: 10px 10px 0; flex: 1; overflow-y: auto; }
        .portal-group-label { padding: 14px 10px 6px; font-size: 10px; font-weight: 800; color: rgba(255,255,255,.3); text-transform: uppercase; letter-spacing: .08em; }
        .portal-shell-collapsed .portal-group-label { display: none; }
        .portal-nav-item {
          width: 100%; border: 0; background: transparent; color: rgba(255,255,255,.62);
          display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 9px;
          font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; text-align: left;
        }
        .portal-nav-item:hover { background: rgba(255,255,255,.07); color: #fff; }
        .portal-nav-item.active { background: rgba(59,130,246,.18); color: #93c5fd; }
        .portal-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
        .portal-shell-collapsed .portal-nav-item span:last-child { display: none; }
        .portal-user { margin: 12px; padding: 12px; border-radius: 12px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); }
        .portal-user-name { font-size: 12px; font-weight: 800; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .portal-user-role { margin-top: 3px; font-size: 10px; color: rgba(255,255,255,.48); text-transform: uppercase; letter-spacing: .08em; }
        .portal-logout { margin-top: 10px; width: 100%; border: 0; border-radius: 8px; padding: 8px 10px; background: #1e293b; color: #e2e8f0; cursor: pointer; font-weight: 800; }
        .portal-shell-collapsed .portal-user-name, .portal-shell-collapsed .portal-user-role, .portal-shell-collapsed .portal-logout { display: none; }
        .portal-content { flex: 1; min-width: 0; }
      `}</style>
      <aside className="portal-sidebar">
        <div className="portal-sidebar-head">
          <img className="portal-logo" src="/vjtiLogo.png" alt="VJTI" />
          <div className="portal-brand">
            <div className="portal-brand-title">VJTI</div>
            <div className="portal-brand-sub">Chargesheet Portal</div>
          </div>
          <button className="portal-toggle" onClick={toggleSidebar} title={collapsed ? "Open sidebar" : "Close sidebar"}>
            {collapsed ? ">" : "<"}
          </button>
        </div>
        <nav className="portal-nav">
          {NAV_GROUPS.map((group) => {
            if (group.roles && !isVisible(group.roles)) return null;
            const items = group.items.filter((item) => isVisible(item.roles));
            if (!items.length) return null;
            return (
              <React.Fragment key={group.label}>
                <div className="portal-group-label">{group.label}</div>
                {items.map((item) => (
                  <button
                    key={item.label}
                    className={`portal-nav-item ${location.pathname === item.path ? "active" : ""}`}
                    onClick={() => navigate(item.path)}
                    title={item.label}
                  >
                    <span className="portal-dot" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </React.Fragment>
            );
          })}
        </nav>
        <div className="portal-user">
          <div className="portal-user-name">{user?.user?.name || "User"}</div>
          <div className="portal-user-role">{userRole}</div>
          <button className="portal-logout" onClick={logout}>Logout</button>
        </div>
      </aside>
      <div className="portal-content">{children}</div>
    </div>
  );
}
