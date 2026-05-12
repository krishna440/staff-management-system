import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  loadTaskRates,
  saveTaskRates,
  resetTaskRatesToDefaults,
  TASK_RATES_CHANGED_EVENT,
  DEFAULT_TASK_RATES,
} from "../utils/taskRates";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const TaskRates = () => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState(() => loadTaskRates());
  const [savedFlash, setSavedFlash] = useState(false);
  const [dirty, setDirty] = useState(false);

  const pullFromStorage = useCallback(() => {
    setDraft(loadTaskRates());
    setDirty(false);
  }, []);

  useEffect(() => {
    const onExternal = () => pullFromStorage();
    window.addEventListener(TASK_RATES_CHANGED_EVENT, onExternal);
    window.addEventListener("storage", onExternal);
    return () => {
      window.removeEventListener(TASK_RATES_CHANGED_EVENT, onExternal);
      window.removeEventListener("storage", onExternal);
    };
  }, [pullFromStorage]);

  const updateTeaching = (field, value) => {
    const num = Math.max(0, Number(value) || 0);
    setDraft((d) => ({ ...d, [field]: num }));
    setDirty(true);
    setSavedFlash(false);
  };

  const updateDuty = (index, field, value) => {
    setDraft((d) => {
      const duties = d.duties.map((row, i) => {
        if (i !== index) return row;
        if (field === "label") return { ...row, label: value };
        if (field === "rate") return { ...row, rate: Math.max(0, Number(value) || 0) };
        return row;
      });
      return { ...d, duties };
    });
    setDirty(true);
    setSavedFlash(false);
  };

  const handleSave = () => {
    saveTaskRates(draft);
    setSavedFlash(true);
    setDirty(false);
    setTimeout(() => setSavedFlash(false), 3200);
  };

  const handleReset = () => {
    if (
      !window.confirm(
        "Reset all task rates to installation defaults? This cannot be undone."
      )
    ) {
      return;
    }
    resetTaskRatesToDefaults();
    setDraft(loadTaskRates());
    setDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 3200);
  };

  return (
    <div className="tr-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .tr-root {
          min-height: 100vh;
          background: linear-gradient(165deg, #f0f4ff 0%, #eef2ff 40%, #faf5ff 100%);
          font-family: 'Inter', system-ui, sans-serif;
          color: #0f172a;
        }
        .tr-top {
          position: sticky; top: 0; z-index: 20;
          background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #5b21b6 100%);
          padding: 16px 28px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          box-shadow: 0 8px 32px rgba(49,46,129,.35);
        }
        .tr-top h1 { color: #fff; font-size: 18px; font-weight: 800; margin: 0; letter-spacing: -0.02em; }
        .tr-top p { color: rgba(255,255,255,.72); font-size: 12px; margin: 4px 0 0; font-weight: 500; }
        .tr-back {
          border: 1px solid rgba(255,255,255,.28);
          background: rgba(255,255,255,.1);
          color: #fff;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          font-family: inherit;
          backdrop-filter: blur(8px);
        }
        .tr-back:hover { background: rgba(255,255,255,.2); }
        .tr-wrap { max-width: 1120px; margin: 0 auto; padding: 28px 24px 80px; }
        .tr-banner {
          border-radius: 14px;
          padding: 12px 18px;
          margin-bottom: 22px;
          font-size: 13px;
          font-weight: 600;
          display: flex; align-items: center; gap: 10px;
          animation: trIn .28s ease;
        }
        @keyframes trIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        .tr-banner.ok { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
        .tr-banner.info { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }
        .tr-section-head {
          display: flex; align-items: baseline; gap: 12px; margin-bottom: 16px;
        }
        .tr-section-head h2 { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #64748b; margin: 0; }
        .tr-section-head span { font-size: 12px; color: #94a3b8; font-weight: 500; }
        .tr-teach-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 18px;
          margin-bottom: 36px;
        }
        .tr-hero-card {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 24px rgba(79,70,229,.08), 0 1px 3px rgba(0,0,0,.05);
          position: relative;
          overflow: hidden;
        }
        .tr-hero-card::after {
          content: '';
          position: absolute;
          inset: auto -40% -40% auto;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(99,102,241,.12), transparent 70%);
          pointer-events: none;
        }
        .tr-hero-icon {
          width: 44px; height: 44px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-weight: 800;
          font-size: 13px;
          color: #fff;
          margin-bottom: 14px;
        }
        .tr-hero-title { font-size: 17px; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
        .tr-hero-sub { font-size: 13px; color: #64748b; margin-bottom: 18px; line-height: 1.45; }
        .tr-inp-wrap {
          display: flex; align-items: stretch;
          border: 2px solid #e2e8f0;
          border-radius: 14px;
          overflow: hidden;
          background: #f8fafc;
          transition: border-color .2s, box-shadow .2s;
        }
        .tr-inp-wrap:focus-within {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(129,140,248,.2);
          background: #fff;
        }
        .tr-inp-prefix {
          padding: 14px 14px;
          font-weight: 800;
          color: #6366f1;
          background: rgba(99,102,241,.08);
          display: flex; align-items: center;
        }
        .tr-inp {
          flex: 1;
          border: none;
          padding: 14px 16px;
          font-size: 22px;
          font-weight: 800;
          font-family: 'Inter', ui-monospace, monospace;
          color: #0f172a;
          background: transparent;
          outline: none;
          min-width: 0;
        }
        .tr-inp-hint { margin-top: 10px; font-size: 11px; color: #94a3b8; font-weight: 600; }
        .tr-duty-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 14px;
        }
        .tr-duty-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e8edf7;
          padding: 16px 18px;
          box-shadow: 0 2px 12px rgba(15,23,42,.04);
          transition: transform .15s, box-shadow .15s;
        }
        .tr-duty-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 28px rgba(67,56,202,.1);
        }
        .tr-duty-key {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: #a5b4fc;
          margin-bottom: 8px;
        }
        .tr-duty-label-inp {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 12px;
          font-family: inherit;
        }
        .tr-duty-label-inp:focus { outline: none; border-color: #818cf8; box-shadow: 0 0 0 3px rgba(129,140,248,.15); }
        .tr-duty-rate-row { display: flex; align-items: center; gap: 8px; }
        .tr-duty-rate-row span { font-size: 12px; font-weight: 700; color: #64748b; }
        .tr-duty-rate-inp {
          flex: 1;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 16px;
          font-weight: 800;
          font-family: inherit;
        }
        .tr-duty-rate-inp:focus { outline: none; border-color: #818cf8; }
        .tr-bar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          padding: 16px 24px;
          background: rgba(255,255,255,.92);
          backdrop-filter: blur(12px);
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          box-shadow: 0 -8px 32px rgba(15,23,42,.06);
          z-index: 30;
        }
        .tr-btn-save {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff;
          border: none;
          padding: 14px 28px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          box-shadow: 0 8px 24px rgba(79,70,229,.35);
        }
        .tr-btn-save:disabled {
          opacity: .45;
          cursor: not-allowed;
          box-shadow: none;
        }
        .tr-btn-reset {
          background: #f1f5f9;
          color: #475569;
          border: 1.5px solid #e2e8f0;
          padding: 14px 22px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
        }
        .tr-chip {
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          background: #fef3c7;
          color: #92400e;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
      `}</style>

      <header className="tr-top">
        <div>
          <h1>Task rates</h1>
          <p>
            Configure teaching, assessment, and per-session duty rates. New charge
            sheets use these values; saved rows keep their stored amounts.
          </p>
        </div>
        <button type="button" className="tr-back" onClick={() => navigate("/")}>
          ← Dashboard
        </button>
      </header>

      <div className="tr-wrap">
        {savedFlash && (
          <div className="tr-banner ok" role="status">
            <span>✓</span> Settings saved. Charge sheet and exports will use the updated rates.
          </div>
        )}
        {dirty && !savedFlash && (
          <div className="tr-banner info">
            <span className="tr-chip">Draft</span>
            You have unsaved changes. Save to apply across the app.
          </div>
        )}

        <div className="tr-section-head">
          <h2>Teaching — exam sheet</h2>
          <span>Paper setting &amp; assessment unit rates</span>
        </div>
        <div className="tr-teach-grid">
          <div className="tr-hero-card">
            <div className="tr-hero-icon" style={{ background: "linear-gradient(135deg,#6366f1,#4f46e5)" }}>
              PS
            </div>
            <div className="tr-hero-title">Paper setting</div>
            <div className="tr-hero-sub">
              Rupees per question paper set (used with “No. of sets” on the teaching
              charge sheet).
            </div>
            <div className="tr-inp-wrap">
              <span className="tr-inp-prefix">₹</span>
              <input
                className="tr-inp"
                type="number"
                min={0}
                value={draft.paperSettingPerSet}
                onChange={(e) => updateTeaching("paperSettingPerSet", e.target.value)}
                aria-label="Paper setting rate per set"
              />
            </div>
            <div className="tr-inp-hint">Current: ₹{fmt(draft.paperSettingPerSet)} / set · Default was ₹{fmt(DEFAULT_TASK_RATES.paperSettingPerSet)}</div>
          </div>

          <div className="tr-hero-card">
            <div className="tr-hero-icon" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
              AS
            </div>
            <div className="tr-hero-title">Paper assessment</div>
            <div className="tr-hero-sub">
              Rupees per paper assessed (theory and lab assessment counts on the charge
              sheet).
            </div>
            <div className="tr-inp-wrap">
              <span className="tr-inp-prefix">₹</span>
              <input
                className="tr-inp"
                type="number"
                min={0}
                value={draft.assessmentPerPaper}
                onChange={(e) => updateTeaching("assessmentPerPaper", e.target.value)}
                aria-label="Assessment rate per paper"
              />
            </div>
            <div className="tr-inp-hint">Current: ₹{fmt(draft.assessmentPerPaper)} / paper · Default was ₹{fmt(DEFAULT_TASK_RATES.assessmentPerPaper)}</div>
          </div>
        </div>

        <div className="tr-section-head">
          <h2>Exam duties</h2>
          <span>Per session — teaching &amp; non-teaching duty block</span>
        </div>
        <div className="tr-duty-grid">
          {draft.duties.map((duty, index) => (
            <div key={duty.key} className="tr-duty-card">
              <div className="tr-duty-key">{duty.key.replace(/_/g, " ")}</div>
              <input
                className="tr-duty-label-inp"
                value={duty.label}
                onChange={(e) => updateDuty(index, "label", e.target.value)}
                aria-label={`Display name for ${duty.key}`}
              />
              <div className="tr-duty-rate-row">
                <span>₹ / session</span>
                <input
                  className="tr-duty-rate-inp"
                  type="number"
                  min={0}
                  value={duty.rate}
                  onChange={(e) => updateDuty(index, "rate", e.target.value)}
                  aria-label={`Rate for ${duty.label}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="tr-bar">
        <button type="button" className="tr-btn-save" disabled={!dirty} onClick={handleSave}>
          Save all rates
        </button>
        <button type="button" className="tr-btn-reset" onClick={handleReset}>
          Reset to defaults
        </button>
      </div>
    </div>
  );
};

export default TaskRates;
