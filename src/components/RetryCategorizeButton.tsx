"use client";

import { useActionState } from "react";
import { retryCategorizeAction } from "@/app/project/[id]/actions";

export default function RetryCategorizeButton({ projectId }: { projectId: string }) {
  const boundAction = retryCategorizeAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <form action={formAction} className="flex flex-col items-center gap-2">
      {state?.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
      >
        {pending ? "카테고리 추출 중..." : "카테고리 추출 다시 시도"}
      </button>
    </form>
  );
}
