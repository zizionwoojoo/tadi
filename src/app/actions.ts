"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Creates an empty project and sends the user into it, where Stage 2 will
// prompt for meeting minutes to analyze. Called directly as a <form action>
// from the hub screen's "새 프로젝트(회의) 시작하기" button.
export async function createProjectAction() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const project = await prisma.project.create({
    data: {
      title: `새 프로젝트 - ${new Date().toLocaleDateString("ko-KR")}`,
      ownerId: session.user.id,
    },
  });

  redirect(`/project/${project.id}`);
}

async function requireOwnProject(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== userId) {
    throw new Error("프로젝트를 찾을 수 없습니다.");
  }
  return project;
}

const renameSchema = z.object({
  title: z.string().trim().min(1, "프로젝트 이름을 입력해주세요.").max(60, "60자 이내로 입력해주세요."),
});

export type RenameProjectState = { error?: string } | undefined;

export async function renameProjectAction(
  projectId: string,
  _prevState: RenameProjectState,
  formData: FormData
): Promise<RenameProjectState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const parsed = renameSchema.safeParse({ title: formData.get("title") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "프로젝트 이름을 입력해주세요." };
  }

  await requireOwnProject(projectId, session.user.id);

  await prisma.project.update({
    where: { id: projectId },
    data: { title: parsed.data.title },
  });

  revalidatePath("/");
}

export async function deleteProjectAction(projectId: string) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  await requireOwnProject(projectId, session.user.id);

  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/");
}
