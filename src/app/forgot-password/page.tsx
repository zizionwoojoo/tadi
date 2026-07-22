"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordResetAction } from "./actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-center text-2xl font-bold text-zinc-900 dark:text-white">비밀번호 재설정</h1>
        <p className="mb-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          가입한 이메일을 입력하면 재설정 링크를 보내드려요.
        </p>

        {state?.sent ? (
          <p className="rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            이메일이 등록되어 있다면 재설정 링크를 보냈어요. 메일함을 확인해주세요.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                placeholder="you@example.com"
              />
            </div>

            {state?.error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? "전송 중..." : "재설정 링크 보내기"}
            </button>
          </form>
        )}

        <div className="mt-5 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <Link href="/login" className="font-medium text-blue-600 hover:underline">
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
