"use client";
import { useState } from "react";
import { sanitizeGST, isValidGST } from "@/lib/types";

interface GSTInputProps {
  onSubmit: (gst: string) => void;
  loading: boolean;
}

export default function GSTInput({ onSubmit, loading }: GSTInputProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const sanitized = sanitizeGST(value);
  const isValid = isValidGST(sanitized);
  const showError = touched && value.trim().length > 0 && !isValid;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    setTouched(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (isValid) onSubmit(sanitized);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="gst-input" className="text-sm font-medium text-gray-700">
        Enter GSTIN
      </label>
      <div className="flex gap-2">
        <input
          id="gst-input"
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          placeholder="e.g. 22AAAAA0000A1Z5"
          maxLength={20}
          disabled={loading}
          autoComplete="off"
          spellCheck={false}
          className={[
            "flex-1 px-4 py-3 rounded-lg border text-sm font-mono tracking-widest uppercase",
            "focus:outline-none focus:ring-2 transition-colors",
            isValid
              ? "border-green-400 focus:ring-green-200 text-green-800"
              : showError
              ? "border-red-400 focus:ring-red-200 text-gray-900"
              : "border-gray-300 focus:ring-blue-200 text-gray-900",
            loading ? "opacity-60 cursor-not-allowed" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
        <button
          type="submit"
          disabled={loading || !isValid}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          {loading ? "Checking…" : "Verify"}
        </button>
      </div>
      {showError && (
        <p className="text-xs text-red-600">
          Invalid GST format. Must be 15 characters — e.g. 30AATFR8425R2ZC
        </p>
      )}
      {isValid && (
        <p className="text-xs text-green-600">Valid GSTIN format ✓</p>
      )}
    </form>
  );
}
