import Link from "next/link";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">유효하지 않은 링크입니다.</p>
          <Link
            href="/forgot-password"
            className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            비밀번호 재설정 다시 요청하기
          </Link>
        </div>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}
