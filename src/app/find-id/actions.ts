"use server";

import { prisma } from "@/lib/prisma";
import { maskEmail } from "@/lib/mask";

export type FindIdState = { emails: string[] } | undefined;

export async function findIdAction(
  _prevState: FindIdState,
  formData: FormData
): Promise<FindIdState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { emails: [] };
  }

  const users = await prisma.user.findMany({ where: { name } });
  return { emails: users.map((u) => maskEmail(u.email)) };
}
