"use client";

import { useState } from "react";
import type { AgendaCardData } from "@/app/project/[id]/types";
import type { ResolveResolution } from "@/app/project/[id]/actions";

export default function AgendaReviewModal({
  agenda,
  onClose,
  onResolve,
}: {
  agenda: AgendaCardData;
  onClose: () => void;
  onResolve: (resolution: ResolveResolution, editedSummary?: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(agenda.currentSummary);
  const [pending, setPending] = useState<ResolveResolution | null>(null);

  async function commit(resolution: ResolveResolution, editedSummary?: string) {
    setPending(resolution);
    try {
      await onResolve(resolution, editedSummary);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{agenda.title}</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            autoFocus
            className="mb-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
        ) : (
          <p className="mb-4 font-semibold text-zinc-800 dark:text-zinc-100">{agenda.currentSummary}</p>
        )}

        {agenda.issues.length > 0 && (
          <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
            <p className="mb-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
              AI가 발견한 문제점
            </p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-amber-700 dark:text-amber-300">
              {agenda.issues.map((issue, i) => (
                <li key={i}>{issue}</li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              <span className="font-semibold">AI 제안:</span> {agenda.aiSuggestion}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {editing ? (
            <button
              onClick={() => commit("direct_edit", draft)}
              disabled={pending !== null}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {pending === "direct_edit" ? "저장 중..." : "수정 완료"}
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              disabled={pending !== null}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              직접 수정
            </button>
          )}

          <button
            onClick={() => commit("ai_applied")}
            disabled={pending !== null}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {pending === "ai_applied" ? "적용 중..." : "AI 제안 적용"}
          </button>

          <button
            onClick={() => commit("original_kept")}
            disabled={pending !== null}
            className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 disabled:opacity-60 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            {pending === "original_kept" ? "저장 중..." : "원본 그대로 진행"}
          </button>
        </div>
      </div>
    </div>
  );
}
