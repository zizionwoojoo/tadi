"use client";

import { useState, useTransition } from "react";
import {
  openAgendaReviewAction,
  resolveAgendaAction,
  advanceProjectAction,
  type ResolveResolution,
} from "@/app/project/[id]/actions";
import type { AgendaCardData, AgendaStatus } from "@/app/project/[id]/types";
import AgendaReviewModal from "./AgendaReviewModal";

const COLUMNS: { key: AgendaStatus; label: string }[] = [
  { key: "pending", label: "진행 대기" },
  { key: "reviewing", label: "리뷰 중" },
  { key: "done", label: "완료" },
];

export default function KanbanBoard({
  projectId,
  initialAgendas,
}: {
  projectId: string;
  initialAgendas: AgendaCardData[];
}) {
  const [agendas, setAgendas] = useState(initialAgendas);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdvancing, startAdvance] = useTransition();
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const selected = agendas.find((a) => a.id === selectedId) ?? null;
  const allDone = agendas.length > 0 && agendas.every((a) => a.status === "done");

  async function handleOpenCard(agenda: AgendaCardData) {
    setSelectedId(agenda.id);
    if (agenda.status !== "pending") return;

    setAgendas((prev) =>
      prev.map((a) => (a.id === agenda.id ? { ...a, status: "reviewing" } : a))
    );
    try {
      await openAgendaReviewAction(agenda.id);
    } catch {
      setAgendas((prev) =>
        prev.map((a) => (a.id === agenda.id ? { ...a, status: "pending" } : a))
      );
    }
  }

  async function handleResolve(resolution: ResolveResolution, editedSummary?: string) {
    if (!selected) return;
    const updated = await resolveAgendaAction(selected.id, resolution, editedSummary);
    setAgendas((prev) =>
      prev.map((a) =>
        a.id === updated.id
          ? {
              ...a,
              currentSummary: updated.currentSummary,
              status: updated.status as AgendaStatus,
              resolution: updated.resolution,
            }
          : a
      )
    );
    setSelectedId(null);
  }

  function handleAdvance() {
    setAdvanceError(null);
    startAdvance(async () => {
      try {
        await advanceProjectAction(projectId);
      } catch (error) {
        setAdvanceError(error instanceof Error ? error.message : "다음 단계로 이동하지 못했습니다.");
      }
    });
  }

  return (
    <div className="relative flex-1 bg-zinc-50 px-6 py-8 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 pb-24 md:grid-cols-3">
        {COLUMNS.map((column) => {
          const items = agendas
            .filter((a) => a.status === column.key)
            .sort((a, b) => a.order - b.order);

          return (
            <div key={column.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                  {column.label}
                </h2>
                <span className="text-xs text-zinc-400">{items.length}</span>
              </div>

              <div className="flex min-h-[140px] flex-col gap-3 rounded-xl bg-zinc-100/60 p-3 dark:bg-zinc-900/40">
                {items.map((agenda) => (
                  <button
                    key={agenda.id}
                    onClick={() => handleOpenCard(agenda)}
                    className="rounded-lg border border-zinc-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <h3 className="mb-1 line-clamp-1 font-semibold text-zinc-900 dark:text-white">
                      {agenda.title}
                    </h3>
                    <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {agenda.currentSummary}
                    </p>
                  </button>
                ))}
                {items.length === 0 && (
                  <p className="py-6 text-center text-xs text-zinc-400">카드 없음</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-2">
        {advanceError && (
          <p className="max-w-xs rounded-md bg-red-50 px-3 py-2 text-right text-xs text-red-600 dark:bg-red-950 dark:text-red-400">
            {advanceError}
          </p>
        )}
        <button
          onClick={handleAdvance}
          disabled={!allDone || isAdvancing}
          className={`rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 ${
            allDone
              ? "bg-blue-600 hover:bg-blue-700"
              : "pointer-events-none translate-y-4 opacity-0"
          }`}
        >
          {isAdvancing ? "이동 중..." : "프로젝트 진행하기 →"}
        </button>
      </div>

      {selected && (
        <AgendaReviewModal
          agenda={selected}
          onClose={() => setSelectedId(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
}
