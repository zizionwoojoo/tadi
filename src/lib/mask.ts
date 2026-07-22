export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;

  if (local.length <= 4) {
    return `${local.slice(0, 1)}${"*".repeat(Math.max(local.length - 1, 1))}@${domain}`;
  }

  return `${local.slice(0, 3)}***${local.slice(-2)}@${domain}`;
}
