"use client";

import { useEffect, useState, useTransition } from "react";
import { generateCategoryTasksAction, toggleTaskAction } from "@/app/project/[id]/actions";
import type { CategoryData, TaskData } from "@/app/project/[id]/types";

export default function CategoryDetailModal({
  category,
  onClose,
  onTasksGenerated,
  onTaskToggled,
}: {
  category: CategoryData;
  onClose: () => void;
  onTasksGenerated: (tasks: TaskData[]) => void;
  onTaskToggled: (taskId: string, completed: boolean) => void;
}) {
  const [isGenerating, startGenerating] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const memberIdsWithTasks = new Set(category.tasks.map((t) => t.memberId));
    const hasMemberWithoutTasks = category.members.some((m) => !memberIdsWithTasks.has(m.id));

    if (hasMemberWithoutTasks) {
      startGenerating(async () => {
        try {
          const tasks = await generateCategoryTasksAction(category.id);
          onTasksGenerated(tasks);
        } catch (err) {
          setError(err instanceof Error ? err.message : "업무 생성에 실패했습니다.");
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.id, category.members.length, category.tasks.length]);

  const total = category.tasks.length;
  const done = category.tasks.filter((t) => t.completed).length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  async function handleToggle(task: TaskData) {
    const nextCompleted = !task.completed;
    setPendingTaskId(task.id);
    onTaskToggled(task.id, nextCompleted);
    try {
      await toggleTaskAction(task.id, nextCompleted);
    } catch {
      onTaskToggled(task.id, task.completed);
    } finally {
      setPendingTaskId(null);
    }
  }

  const membersWithTasks = category.members.map((member) => ({
    member,
    tasks: category.tasks
      .filter((t) => t.memberId === member.id)
      .sort((a, b) => a.order - b.order),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900">
        <div className="relative h-11 w-full shrink-0 overflow-hidden bg-zinc-800">
          <div
            className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
            {category.name} · {progress}%
          </div>
          <button
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 transition-colors hover:text-white"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {category.members.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              먼저 대시보드에서 이 카테고리에 팀원을 배치해주세요.
            </p>
          )}

          {isGenerating && (
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">AI가 업무를 배분하는 중...</p>
          )}

          {error && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {membersWithTasks.map(({ member, tasks }) => (
              <div key={member.id}>
                <h3 className="mb-2 font-bold text-zinc-900 dark:text-white">{member.name}</h3>
                <ul className="flex flex-col gap-1.5">
                  {tasks.map((task) => (
                    <li key={task.id} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        disabled={pendingTaskId === task.id}
                        onChange={() => handleToggle(task)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                      />
                      <span
                        className={`text-sm ${
                          task.completed
                            ? "text-zinc-400 line-through"
                            : "text-zinc-700 dark:text-zinc-200"
                        }`}
                      >
                        {task.text}
                      </span>
                    </li>
                  ))}
                  {tasks.length === 0 && !isGenerating && (
                    <li className="text-xs text-zinc-400">할 일이 아직 없습니다.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
