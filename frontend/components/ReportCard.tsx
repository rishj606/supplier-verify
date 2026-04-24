import type { SupplierReport } from "@/lib/types";
import TrustScore from "./TrustScore";
import FeedbackButton from "./FeedbackButton";

interface ReportCardProps {
  report: SupplierReport;
}

export default function ReportCard({ report }: ReportCardProps) {
  const gst = report.gst_data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {report.company_name}
        </h1>
        <p className="text-sm font-mono text-gray-400 mt-1">
          {report.gst_number}
        </p>
      </div>

      {/* Trust score */}
      <TrustScore score={report.trust_score} recommendation={report.recommendation} />

      {/* AI summary */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Summary
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">{report.ai_summary}</p>
      </section>

      {/* Red flags */}
      {report.red_flags.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Red Flags
          </h2>
          <ul className="flex flex-col gap-2">
            {report.red_flags.map((flag, i) => (
              <li key={i} className="flex gap-2 text-sm text-red-700">
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Positive signals */}
      {report.positive_signals.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Positive Signals
          </h2>
          <ul className="flex flex-col gap-2">
            {report.positive_signals.map((signal, i) => (
              <li key={i} className="flex gap-2 text-sm text-green-700">
                <span className="shrink-0 mt-0.5">✓</span>
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* GST details */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          GST Details
        </h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Status</dt>
            <dd
              className={
                gst.status === "active"
                  ? "font-semibold text-green-700"
                  : "font-semibold text-red-700"
              }
            >
              {gst.status.charAt(0).toUpperCase() + gst.status.slice(1)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Business Type</dt>
            <dd className="text-gray-800">{gst.business_type || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Registered Since</dt>
            <dd className="text-gray-800">{gst.registration_date || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">State</dt>
            <dd className="text-gray-800">{gst.state || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Filing Type</dt>
            <dd className="text-gray-800">{gst.filing_frequency || "—"}</dd>
          </div>
          {gst.last_filed && (
            <div>
              <dt className="text-xs text-gray-400 mb-0.5">Last Filed</dt>
              <dd className="text-gray-800">{gst.last_filed}</dd>
            </div>
          )}
        </dl>
      </section>

      {/* Feedback */}
      <FeedbackButton reportId={report.id} gstNumber={report.gst_number} />
    </div>
  );
}
