import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[password reset] ${to} -> ${resetUrl}`);
  }

  const { error } = await resend.emails.send({
    from: "tadi <onboarding@resend.dev>",
    to,
    subject: "tadi 비밀번호 재설정",
    html: `
      <p>tadi 계정의 비밀번호를 재설정하려면 아래 링크를 눌러주세요.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>이 링크는 1시간 동안만 유효합니다. 본인이 요청하지 않았다면 이 이메일을 무시하세요.</p>
    `,
  });

  // The Resend SDK returns API errors in the response instead of throwing,
  // so they'd otherwise pass through silently as a "sent" success.
  if (error) {
    throw new Error(error.message);
  }
}
