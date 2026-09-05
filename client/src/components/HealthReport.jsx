function HealthReport({ report }) {
  if (!report) {
    return null;
  }

  return (
    <div className="health-report">
      <div className="report-header">
        <div>
          <h2>Health Screening Report</h2>

          <p>
            Generated from your VoxCare AI
            screening conversation.
          </p>
        </div>

        <span
          className={
            report.status === "complete"
              ? "status complete"
              : "status incomplete"
          }
        >
          {report.status === "complete"
            ? "Complete"
            : "Incomplete"}
        </span>
      </div>

      {/* PATIENT */}
      <div className="report-section">
        <h3>Patient</h3>

        <p>
          <strong>Name:</strong>{" "}
          {report.patientName ||
            "Not provided"}
        </p>
      </div>

      {/* MAIN CONCERN */}
      <div className="report-section">
        <h3>Main Concern</h3>

        <p>
          {report.mainConcern ||
            "Not provided"}
        </p>
      </div>

      {/* SYMPTOMS */}
      <div className="report-section">
        <h3>Symptoms</h3>

        {report.symptoms?.length > 0 ? (
          <ul>
            {report.symptoms.map(
              (symptom, index) => (
                <li key={index}>
                  {symptom}
                </li>
              )
            )}
          </ul>
        ) : (
          <p>None reported.</p>
        )}
      </div>

      {/* DETAILS */}
      <div className="report-grid">
        <div className="report-card">
          <h4>Duration</h4>

          <p>
            {report.duration ||
              "Not provided"}
          </p>
        </div>

        <div className="report-card">
          <h4>Severity</h4>

          <p>
            {report.severity ||
              "Not provided"}
          </p>
        </div>
      </div>

      {/* RELATED SYMPTOMS */}
      <div className="report-section">
        <h3>Related Symptoms</h3>

        {report.relatedSymptoms?.length >
        0 ? (
          <ul>
            {report.relatedSymptoms.map(
              (symptom, index) => (
                <li key={index}>
                  {symptom}
                </li>
              )
            )}
          </ul>
        ) : (
          <p>
            No related symptoms
            reported.
          </p>
        )}
      </div>

      {/* FLAGS */}
      <div className="report-section">
        <h3>Follow-up Flags</h3>

        {report.importantFlags?.length >
        0 ? (
          <ul>
            {report.importantFlags.map(
              (flag, index) => (
                <li key={index}>
                  {flag}
                </li>
              )
            )}
          </ul>
        ) : (
          <p>
            No specific flags were
            identified from the
            information provided.
          </p>
        )}
      </div>

      {/* FOLLOW UP */}
      <div className="report-section">
        <h3>Recommended Follow-up</h3>

        <p>
          {report.followUp ||
            "Further evaluation may be appropriate if symptoms persist or worsen."}
        </p>
      </div>

      {/* MISSING INFORMATION */}
      {report.missingInformation
        ?.length > 0 && (
        <div className="report-section">
          <h3>Information Not Provided</h3>

          <ul>
            {report.missingInformation.map(
              (item, index) => (
                <li key={index}>
                  {item}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {/* DISCLAIMER */}
      <div className="report-disclaimer">
        <strong>Important:</strong>

        <p>
          This report is a summary of the
          information provided during the
          VoxCare AI screening. It is not a
          medical diagnosis or a substitute
          for professional medical advice.
        </p>
      </div>
    </div>
  );
}

export default HealthReport;