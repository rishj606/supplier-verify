"use client";
import { useState } from "react";

interface FeedbackButtonProps {
  reportId: string;
  gstNumber: string;
}

type State = "idle" | "submitting" | "done" | "error";

export default function FeedbackButton({
  reportId,
  gstNumber,
}: FeedbackButtonProps) {
  const [state, setState] = useState<State>("idle");

  async function handleContext(context: "vendor_check" | "exploratory") {
    setState("submitting");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: reportId,
          gst_number: gstNumber,
          context,
        }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-4">
        <p className="text-sm text-gray-500">Thanks — this helps improve our data.</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4">
        <p className="text-sm text-red-600">
          Couldn&apos;t save your response. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex flex-col gap-3">
      <p className="text-sm font-medium text-blue-900">
        Are you evaluating this business as a potential vendor or supplier?
      </p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => handleContext("vendor_check")}
          disabled={state === "submitting"}
          className="px-4 py-2 text-sm font-medium bg-white text-gray-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          ✓ Yes, I&apos;m vetting them
        </button>
        <button
          onClick={() => handleContext("exploratory")}
          disabled={state === "submitting"}
          className="px-4 py-2 text-sm font-medium bg-white text-gray-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          🔍 No, just exploring
        </button>
      </div>
    </div>
  );
}
