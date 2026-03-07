import { useMemo } from "react";
import { useProgress } from "../../hooks/useProgress";
import type { Street } from "../../types/street";

interface ProgressDashboardProps {
  streets: Street[];
}

export function ProgressDashboard({ streets }: ProgressDashboardProps) {
  const { progress, resetAll } = useProgress();

  const stats = useMemo(() => {
    const entries = Object.values(progress.streets);
    const totalAsked = entries.reduce((sum, e) => sum + e.timesAsked, 0);
    const totalCorrect = entries.reduce((sum, e) => sum + e.timesCorrect, 0);
    const streetsQuizzed = entries.length;
    const accuracy = totalAsked > 0 ? Math.round((totalCorrect / totalAsked) * 100) : 0;

    const learnedHaupt = Object.keys(progress.learn.hauptverkehr.seen).length;
    const learnedSonstige = Object.keys(progress.learn.sonstige.seen).length;
    const learnedPOI = Object.keys(progress.learn.poi.seen).length;

    return { totalAsked, totalCorrect, streetsQuizzed, accuracy, learnedHaupt, learnedSonstige, learnedPOI };
  }, [progress]);

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalAsked}</div>
          <div className="stat-label">Fragen beantwortet</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.accuracy}%</div>
          <div className="stat-label">Richtig</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.streetsQuizzed}</div>
          <div className="stat-label">Straßen geübt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{streets.length}</div>
          <div className="stat-label">Straßen gesamt</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.learnedHaupt}</div>
          <div className="stat-label">Hauptstraßen gelernt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.learnedSonstige}</div>
          <div className="stat-label">Sonstige gelernt</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.learnedPOI}</div>
          <div className="stat-label">Orte gelernt</div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: 16 }}>
        <button
          className="btn btn-secondary"
          onClick={() => {
            if (confirm("Wirklich alle Fortschritte zurücksetzen?")) resetAll();
          }}
        >
          Fortschritt zurücksetzen
        </button>
      </div>
    </div>
  );
}
