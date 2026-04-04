"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, Download, Languages } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuestionImportTranslateProps {
  quizId: string;
  questionCount: number;
}

export function QuestionImportTranslate({ quizId, questionCount }: QuestionImportTranslateProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [translating, setTranslating] = useState(false);
  const router = useRouter();

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    const confirmed = window.confirm(
      `This will replace all ${questionCount} existing question(s) with the imported ones. Continue?`
    );
    if (!confirmed) {
      e.target.value = "";
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/admin/quizzes/${quizId}/import-questions`, {
      method: "POST",
      body: formData,
    });

    setImporting(false);
    e.target.value = "";

    if (!res.ok) {
      const err = await res.json();
      if (err.details) {
        toast.error(`Import failed: ${err.details.slice(0, 3).join(", ")}${err.details.length > 3 ? "..." : ""}`);
      } else {
        toast.error(err.error || "Import failed");
      }
      return;
    }

    const { imported } = await res.json();
    toast.success(`Imported ${imported} question(s) successfully`);
    router.refresh();
  }

  async function handleTranslate() {
    setTranslating(true);
    const res = await fetch(`/api/admin/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId }),
    });

    setTranslating(false);

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Translation failed");
      return;
    }

    toast.success("Questions translated to Urdu");
    router.refresh();
  }

  function handleDownloadSample() {
    window.location.href = `/api/admin/quizzes/${quizId}/import-questions`;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {/* Download sample */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadSample}
        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
      >
        <Download className="w-3.5 h-3.5 mr-1.5" />
        Sample CSV
      </Button>

      {/* Import */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileRef.current?.click()}
        disabled={importing}
        className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
      >
        <Upload className="w-3.5 h-3.5 mr-1.5" />
        {importing ? "Importing..." : "Import CSV"}
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImport}
      />

      {/* Translate to Urdu */}
      {questionCount > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleTranslate}
          disabled={translating}
          className="border-emerald-700/50 text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300"
        >
          <Languages className="w-3.5 h-3.5 mr-1.5" />
          {translating ? "Translating..." : "Translate to Urdu"}
        </Button>
      )}
    </div>
  );
}
