import { auth, signOut } from "@/auth";
import BrandLogo from "./BrandLogo";

export default async function GNB() {
  const session = await auth();

  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-950">
      <BrandLogo />

      {session?.user && (
        <div className="flex items-center gap-4">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-200"
            title={session.user.name ?? session.user.email ?? ""}
          >
            {(session.user.name ?? session.user.email ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              로그아웃
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
