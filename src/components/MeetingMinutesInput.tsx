"use client";

import { useActionState } from "react";
import { analyzeMinutesAction } from "@/app/project/[id]/actions";

export default function MeetingMinutesInput({
  projectId,
  defaultTitle,
}: {
  projectId: string;
  defaultTitle: string;
}) {
  const boundAction = analyzeMinutesAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-xl font-bold text-zinc-900 dark:text-white">회의록 입력</h1>
        <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
          회의록 텍스트를 붙여넣으면 AI가 안건을 추출하고 논리적으로 검토합니다.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              프로젝트 이름
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={60}
              defaultValue={defaultTitle}
              placeholder="프로젝트 이름을 입력하세요"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <textarea
            name="minutes"
            required
            rows={14}
            placeholder="회의록을 여기에 붙여넣으세요..."
            className="w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />

          {state?.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="self-end rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? "AI 분석 중..." : "AI 분석 실행"}
          </button>
        </form>
      </div>
    </div>
  );
}
