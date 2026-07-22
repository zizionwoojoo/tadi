"use client";

import { useState } from "react";
import Link from "next/link";
import AddMemberMenu from "./AddMemberMenu";
import CategoryDetailModal from "./CategoryDetailModal";
import { memberTagClasses } from "@/lib/color";
import { createProjectAction } from "@/app/actions";
import type { CategoryData, MemberData, TaskData } from "@/app/project/[id]/types";

export default function DashboardBoard({
  initialCategories,
  initialMembers,
}: {
  initialCategories: CategoryData[];
  initialMembers: MemberData[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [members, setMembers] = useState(initialMembers);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const allTasks = categories.flatMap((c) => c.tasks);
  const overallProgress =
    allTasks.length === 0
      ? 0
      : Math.round((allTasks.filter((t) => t.completed).length / allTasks.length) * 100);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;
  const isComplete = allTasks.length > 0 && overallProgress === 100;
  const unstaffedCategories = categories.filter((c) => c.members.length === 0);

  function handleMemberAdded(categoryId: string, member: MemberData) {
    setMembers((prev) => (prev.some((m) => m.id === member.id) ? prev : [...prev, member]));
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId && !c.members.some((m) => m.id === member.id)
          ? { ...c, members: [...c.members, member] }
          : c
      )
    );
  }

  function handleTasksGenerated(categoryId: string, tasks: TaskData[]) {
    setCategories((prev) => prev.map((c) => (c.id === categoryId ? { ...c, tasks } : c)));
  }

  function handleTaskToggled(categoryId: string, taskId: string, completed: boolean) {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? { ...c, tasks: c.tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)) }
          : c
      )
    );
  }

  return (
    <div className="flex-1 bg-zinc-50 dark:bg-zinc-950">
      <div className="relative h-12 w-full overflow-hidden bg-zinc-800">
        <div
          className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-500"
          style={{ width: `${overallProgress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
          {overallProgress}%
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {unstaffedCategories.length > 0 && (
          <p className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
            {unstaffedCategories.map((c) => c.name).join(", ")} 카테고리에 아직 팀원이 배치되지
            않았어요. 이대로 두면 이 카테고리는 할 일 없이 넘어가요.
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {categories.map((category) => {
            const total = category.tasks.length;
            const done = category.tasks.filter((t) => t.completed).length;
            return (
              <div
                key={category.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedCategoryId(category.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedCategoryId(category.id);
                  }
                }}
                className="flex min-h-[180px] cursor-pointer flex-col rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{category.name}</h2>
                  <AddMemberMenu
                    categoryId={category.id}
                    allMembers={members}
                    assignedMemberIds={category.members.map((m) => m.id)}
                    onAdded={(member) => handleMemberAdded(category.id, member)}
                  />
                </div>

                <div className="flex flex-1 flex-wrap content-start items-start gap-2">
                  {category.members.map((member) => (
                    <span
                      key={member.id}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${memberTagClasses(member.id)}`}
                    >
                      {member.name}
                    </span>
                  ))}
                  {category.members.length === 0 && (
                    <p className="text-xs text-zinc-400">아직 배치된 팀원이 없습니다.</p>
                  )}
                </div>

                {total > 0 && (
                  <p className="mt-3 text-xs text-zinc-400">
                    {done}/{total} 완료
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="fixed bottom-8 right-8">
        {isComplete ? (
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-700"
          >
            ✓ 프로젝트 종료
          </Link>
        ) : (
          <form action={createProjectAction}>
            <button
              type="submit"
              className="rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-blue-700"
            >
              + 새 회의 시작하기
            </button>
          </form>
        )}
      </div>

      {selectedCategory && (
        <CategoryDetailModal
          category={selectedCategory}
          onClose={() => setSelectedCategoryId(null)}
          onTasksGenerated={(tasks) => handleTasksGenerated(selectedCategory.id, tasks)}
          onTaskToggled={(taskId, completed) =>
            handleTaskToggled(selectedCategory.id, taskId, completed)
          }
        />
      )}
    </div>
  );
}
