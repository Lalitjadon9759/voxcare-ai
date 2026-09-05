import HealthReport from "./HealthReport";

function Report({ report }) {
  if (!report) {
    return (
      <main className="report-page">
        <section className="report-empty">
          <h2>No Health Report Available</h2>
          <p>
            Complete a voice conversation with VoxCare AI to generate your
            health report.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="report-page">
      <section className="report-section">
        <div className="report-header">
          <span className="report-badge">VoxCare AI</span>
          <h1>Health Screening Report</h1>
          <p>
            This report summarizes the information shared during your
            conversation.
          </p>
        </div>

        <HealthReport report={report} />
      </section>
    </main>
  );
}

export default Report;