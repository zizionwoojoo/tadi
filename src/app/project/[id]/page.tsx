import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import MeetingMinutesInput from "@/components/MeetingMinutesInput";
import KanbanBoard from "@/components/KanbanBoard";
import DashboardBoard from "@/components/DashboardBoard";
import RetryCategorizeButton from "@/components/RetryCategorizeButton";
import type { AgendaCardData, CategoryData } from "./types";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { agendas: { orderBy: { order: "asc" } } },
  });
  if (!project || project.ownerId !== session.user.id) {
    notFound();
  }

  if (project.status === "draft") {
    return <MeetingMinutesInput projectId={project.id} defaultTitle={project.title} />;
  }

  if (project.status === "kanban") {
    const agendas: AgendaCardData[] = project.agendas.map((agenda) => ({
      id: agenda.id,
      title: agenda.title,
      currentSummary: agenda.currentSummary,
      originalSummary: agenda.originalSummary,
      aiSuggestion: agenda.aiSuggestion,
      issues: JSON.parse(agenda.issues) as string[],
      status: agenda.status as AgendaCardData["status"],
      resolution: agenda.resolution,
      order: agenda.order,
    }));

    return <KanbanBoard projectId={project.id} initialAgendas={agendas} />;
  }

  // status is "dashboard" or "done"
  const [categories, members] = await Promise.all([
    prisma.category.findMany({
      where: { projectId: project.id },
      orderBy: { order: "asc" },
      include: {
        members: true,
        tasks: { orderBy: { order: "asc" } },
      },
    }),
    prisma.member.findMany({ where: { projectId: project.id } }),
  ]);

  if (categories.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center dark:bg-zinc-950">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{project.title}</h1>
        <p className="max-w-md text-sm text-zinc-500 dark:text-zinc-400">
          카테고리 추출에 실패했습니다. 다시 시도해주세요.
        </p>
        <RetryCategorizeButton projectId={project.id} />
      </div>
    );
  }

  const categoryData: CategoryData[] = categories.map((category) => ({
    id: category.id,
    name: category.name,
    order: category.order,
    members: category.members.map((m) => ({ id: m.id, name: m.name })),
    tasks: category.tasks.map((t) => ({
      id: t.id,
      text: t.text,
      completed: t.completed,
      memberId: t.memberId,
      order: t.order,
    })),
  }));

  return (
    <>
      {project.status === "done" && (
        <div className="bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white">
          🎉 모든 업무가 완료되었습니다!
        </div>
      )}
      <DashboardBoard
        initialCategories={categoryData}
        initialMembers={members.map((m) => ({ id: m.id, name: m.name }))}
      />
    </>
  );
}
