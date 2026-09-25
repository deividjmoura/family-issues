/** Traduz mensagens do Supabase Auth para PT-BR (client + server). */

const MAP: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed":
    "Confirme seu e-mail antes de entrar (veja a caixa de entrada).",
  "User already registered": "Este e-mail já está cadastrado. Faça login.",
  "Password should be at least 6 characters":
    "A senha precisa ter pelo menos 6 caracteres.",
  "Unable to validate email address: invalid format": "E-mail inválido.",
  "Signup requires a valid password": "Informe uma senha válida.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde um minuto.",
  "For security purposes, you can only request this after":
    "Por segurança, aguarde um pouco antes de tentar de novo.",
};

export function translateAuthError(message: string): string {
  if (MAP[message]) return MAP[message];
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (lower.includes("not confirmed"))
    return "Confirme seu e-mail antes de entrar.";
  if (lower.includes("already registered") || lower.includes("already been"))
    return "Este e-mail já está cadastrado. Faça login.";
  if (lower.includes("password"))
    return "Senha inválida ou muito curta (mínimo 6 caracteres).";
  if (lower.includes("rate limit"))
    return "Muitas tentativas. Aguarde um minuto.";
  if (lower.includes("network")) return "Falha de rede. Tente de novo.";
  return message || "Não foi possível autenticar.";
}
