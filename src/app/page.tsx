import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Project } from "@/generated/prisma/client";
import { createProjectAction } from "./actions";
import ProjectCard from "@/components/ProjectCard";

const STATUS_LABEL: Record<string, string> = {
  draft: "회의록 입력 대기",
  kanban: "안건 검토 중",
  dashboard: "팀 배치 중",
  done: "완료",
};

export default async function HubPage() {
  const session = await auth();
  // The proxy already redirects unauthenticated visitors to /login; this is
  // just a defensive fallback in case the page is ever reached directly.
  if (!session?.user) return null;

  const projects = await prisma.project.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  if (projects.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-4 dark:bg-zinc-950">
        <form action={createProjectAction}>
          <button
            type="submit"
            className="rounded-2xl bg-blue-600 px-10 py-6 text-xl font-bold text-white shadow-lg shadow-blue-600/20 transition-transform hover:scale-[1.02] hover:bg-blue-700"
          >
            + 새 프로젝트(회의) 시작하기
          </button>
        </form>
        <p className="text-sm text-zinc-400">
          {session.user.name}님, 아직 프로젝트가 없어요. 회의록으로 첫 프로젝트를 시작해보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-zinc-50 px-6 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-2xl font-bold text-zinc-900 dark:text-white">내 프로젝트</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <form action={createProjectAction}>
            <button
              type="submit"
              className="flex h-full min-h-[160px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-400 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:hover:border-blue-500"
            >
              <span className="text-3xl leading-none">+</span>
              <span className="text-sm font-medium">새 프로젝트(회의) 시작하기</span>
            </button>
          </form>

          {projects.map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={{
                id: project.id,
                title: project.title,
                statusLabel: STATUS_LABEL[project.status] ?? project.status,
                updatedAtLabel: project.updatedAt.toLocaleDateString("ko-KR"),
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
