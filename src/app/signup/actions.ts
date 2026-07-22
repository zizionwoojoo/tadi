"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";

const signupSchema = z.object({
  name: z.string().trim().min(1, "이름을 입력해주세요.").max(50),
  email: z.string().trim().toLowerCase().email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
});

export type SignupState = { error?: string } | undefined;

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "이미 가입된 이메일입니다." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, password: hashedPassword } });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      // Account was created but auto sign-in failed for some reason;
      // send them to the login page to sign in manually instead.
      redirect("/login");
    }
    throw error;
  }
}
