import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ReportCard from "@/frontend/components/ReportCard";
import type { SupplierReport } from "@/lib/types";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("reports")
    .select("id, report_json")
    .eq("id", id)
    .single();

  if (error || !data?.report_json) {
    notFound();
  }

  const report = data.report_json as SupplierReport;
  // Align report.id with the Supabase row id so the feedback FK always resolves.
  // Old records store a different internal UUID inside report_json.
  report.id = data.id;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline w-fit"
        >
          ← Check another supplier
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <ReportCard report={report} />
        </div>

        <p className="text-xs text-gray-400 text-center">
          Report generated on{" "}
          {new Date(report.generated_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
          . Cached for 7 days.
        </p>
      </div>
    </main>
  );
}
