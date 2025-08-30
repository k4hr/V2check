export type Plan = "WEEK" | "MONTH" | "HALF" | "YEAR";

// НОП-реализация: помечаем покупку в localStorage. Замените на свою логику при необходимости.
export async function applyPlan(plan: Plan) {
  try {
    const till = Date.now() + 60 * 60 * 1000; // 1 час демо
    localStorage.setItem("juristum_pro", JSON.stringify({ plan, till }));
  } catch {}
}
