/** Converte erros do Supabase/PostgREST em mensagens amigáveis em português. */
export function friendlyError(error: unknown, fallback = "Não foi possível concluir a operação."): string {
  if (!error) return fallback;
  const e = error as { message?: string; code?: string };
  const msg = e.message ?? String(error);

  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Sem conexão com a internet. Os dados ficam salvos no aparelho e serão enviados automaticamente.";
  }
  // Mensagens das funções do banco já vêm em português, prontas para o usuário.
  if (/^[A-ZÀ-Ú]/.test(msg) && /[à-úç]/i.test(msg)) return msg;
  if (e.code === "42501" || msg.includes("row-level security")) {
    return "Você não tem permissão para esta ação, ou a inspeção já foi finalizada.";
  }
  if (e.code === "23514") return "Algum campo possui um valor inválido. Revise os dados informados.";
  if (e.code === "23505") return "Já existe um registro com estes dados.";
  return fallback;
}
