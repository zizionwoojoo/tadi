"use client";

import Link from "next/link";
import { useActionState } from "react";
import { findIdAction } from "./actions";

export default function FindIdPage() {
  const [state, formAction, pending] = useActionState(findIdAction, undefined);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-2 text-center text-2xl font-bold text-zinc-900 dark:text-white">아이디 찾기</h1>
        <p className="mb-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          가입할 때 입력한 이름을 입력하면 등록된 이메일을 알려드려요.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              이름
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder="홍길동"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {pending ? "찾는 중..." : "아이디 찾기"}
          </button>
        </form>

        {state && (
          <div className="mt-5 flex flex-col gap-1.5 rounded-lg bg-blue-50 px-3 py-2.5 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {state.emails.length > 0 ? (
              state.emails.map((email) => <p key={email}>{email}</p>)
            ) : (
              <p>일치하는 계정을 찾을 수 없습니다.</p>
            )}
          </div>
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
