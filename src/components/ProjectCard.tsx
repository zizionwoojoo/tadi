"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { renameProjectAction, deleteProjectAction } from "@/app/actions";

export default function ProjectCard({
  project,
}: {
  project: { id: string; title: string; statusLabel: string; updatedAtLabel: string };
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(project.title);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRenameSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await renameProjectAction(project.id, undefined, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
    });
  }

  function handleConfirmDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await deleteProjectAction(project.id);
    });
  }

  if (isEditing) {
    return (
      <div className="flex min-h-[160px] flex-col justify-between rounded-xl border border-blue-300 bg-white p-5 shadow-sm dark:border-blue-600 dark:bg-zinc-900">
        <form action={handleRenameSubmit} className="flex flex-col gap-2">
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            maxLength={60}
            className="w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              저장
            </button>
            <button
              type="button"
              onClick={() => {
                setTitle(project.title);
                setError(null);
                setIsEditing(false);
              }}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <Link
      href={`/project/${project.id}`}
      className="relative flex min-h-[160px] flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="absolute right-3 top-3 flex items-center gap-2 text-xs text-zinc-400">
        {isConfirmingDelete ? (
          <>
            <span className="text-red-600 dark:text-red-400">삭제할까요?</span>
            <button
              onClick={handleConfirmDelete}
              disabled={isPending}
              className="font-semibold text-red-600 transition-colors hover:text-red-700 disabled:opacity-60 dark:text-red-400"
            >
              삭제
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsConfirmingDelete(false);
              }}
              className="hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              취소
            </button>
          </>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="transition-colors hover:text-blue-600"
            >
              수정
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsConfirmingDelete(true);
              }}
              className="transition-colors hover:text-red-600"
            >
              삭제
            </button>
          </>
        )}
      </div>

      <h2 className="line-clamp-2 pr-16 text-lg font-semibold text-zinc-900 dark:text-white">
        {project.title}
      </h2>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span className="rounded-full bg-blue-50 px-2 py-1 font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          {project.statusLabel}
        </span>
        <span>{project.updatedAtLabel}</span>
      </div>
    </Link>
  );
}
