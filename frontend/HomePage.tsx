"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import GSTInput from "./components/GSTInput";
import type { APIResponse, SupplierReport } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(gst: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gst_number: gst }),
      });
      const json: APIResponse<SupplierReport> = await res.json();
      if (!json.success || !json.data) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      router.push(`/report/${json.data.id}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg flex flex-col gap-8">
        {/* Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            SupplierCheck
          </h1>
          <p className="mt-2 text-gray-500 text-base">
            AI-powered trust reports for Indian B2B vendors and suppliers.
          </p>
        </div>

        {/* Input card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
          <GSTInput onSubmit={handleVerify} loading={loading} />

          {loading && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-1">
              <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Generating report… takes about 5 seconds.
            </div>
          )}

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          Built for{" "}
          <span className="font-medium text-gray-500">
            B2B vendor and supplier verification
          </span>
          . Results are most accurate when evaluating a business as a potential
          trading partner. Reports are cached for 7 days and sourced from
          government GST records.
        </p>
      </div>
    </main>
  );
}
