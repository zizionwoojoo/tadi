"use server";

import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

export type ForgotPasswordState = { sent?: boolean; error?: string } | undefined;

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export async function requestPasswordResetAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { error: "이메일을 입력해주세요." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always report success regardless of whether the email is registered, so
  // this form can't be used to probe which emails have accounts.
  if (!user) {
    return { sent: true };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const created = await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (error) {
    // Swallow send failures instead of surfacing them: an error here would
    // only ever happen for a registered email, which defeats the whole
    // point of always returning `sent: true` above. The actual failure is
    // still logged server-side (see sendPasswordResetEmail), and recorded
    // on the token row itself (sendError) since streamed CLI logs have
    // proven unreliable to inspect after the fact.
    console.error("[password reset] failed to send email:", error);
    await prisma.passwordResetToken.update({
      where: { id: created.id },
      data: { sendError: error instanceof Error ? error.message : String(error) },
    });
  }

  return { sent: true };
}
