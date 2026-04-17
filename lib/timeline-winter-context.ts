/**
 * Озимые / осенняя посадка под зиму: в промпте и пост-обработке не планируем
 * обычные работы на период покоя (зима в средней полосе РФ).
 */

/** UTC месяцы: 0=янв … 11=дек — зимнее окно без рутинного ухода: дек, янв, фев. */
function isWinterDormancyMonthUtc(monthIndex: number): boolean {
  return monthIndex === 11 || monthIndex === 0 || monthIndex === 1;
}

/** Сентябрь–ноябрь — типичное окно осенней посадки под зиму. */
function isAutumnPlantingWindow(planted: Date): boolean {
  const m = planted.getUTCMonth();
  return m >= 8 && m <= 10;
}

/**
 * Эвристика: озимая культура или посадка «под зиму» по названию/slug.
 * Не путаем с поздней осенней высадкой рассады томатов и т.п. — опираемся на слова и культуры.
 */
export function isWinterDormancyCrop(
  plantedDate: Date,
  cultureName: string,
  cropSlug: string | null | undefined
): boolean {
  if (!isAutumnPlantingWindow(plantedDate)) return false;

  const name = cultureName.toLowerCase();
  const slug = (cropSlug || "").toLowerCase();

  if (/озим|под\s+зиму|осенн\w+\s+посад/.test(name)) return true;

  // Типичные озимые зерновые / масличные / чеснок под зиму
  if (
    /(пшениц|рожь|ячмен|тритикал|рапс|горчиц|вик[аи]|свёкл\w+\s+семенн|чеснок)/i.test(name)
  ) {
    return true;
  }

  const slugHints =
    /^(pshenitsa|rozh|yachmen|tritikale|raps|gorchitsa|vik|svekla-semenn|chesnok)/i.test(slug) ||
    slug.includes("ozim");
  return slugHints;
}

/** Текст в system prompt: не ставить рутинный уход на дек–фев; весна с марта. */
export function buildWinterDormancyPromptAddendum(
  plantedDate: Date,
  cultureName: string,
  cropSlug: string | null | undefined
): string {
  if (!isWinterDormancyCrop(plantedDate, cultureName, cropSlug)) return "";

  const y = plantedDate.getUTCFullYear();
  return `

ОСОБЫЙ СЛУЧАЙ — озимая культура или посадка под зиму (осень): растение в состоянии покоя зимой.
- Не включай в таймлайн обычные работы по уходу на период с 1 декабря по 28/29 февраля: на грядке зимой с растением обычно ничего не делают (нет поливов, рыхлений, подкормок «по графику»).
- Снегозадержание или лёгкая защита — только если уместно для региона, одной короткой пометкой осенью или при необходимости в раннюю весну, не как ежемесячные задачи зимой.
- Плановые действия по уходу продолжай с ранней весны (с марта, по региону — после схода снега / оттаивания почвы).
- Всё равно нужно минимум 5–8 событий за весь сезон, но даты не должны «забивать» декабрь–февраль рутиной.`;
}

type ParsedEvent = {
  scheduledDate: Date;
  dateTo: Date | null;
  [key: string]: unknown;
};

/** Удаляем события с датой в «спячке» дек–фев для озимых (на случай если модель ошиблась). */
export function filterWinterDormancyEvents<T extends ParsedEvent>(
  events: T[],
  plantedDate: Date,
  cultureName: string,
  cropSlug: string | null | undefined
): T[] {
  if (!isWinterDormancyCrop(plantedDate, cultureName, cropSlug)) return events;

  return events.filter((e) => {
    const m = e.scheduledDate.getUTCMonth();
    if (isWinterDormancyMonthUtc(m)) return false;
    if (e.dateTo) {
      const spanWinter = spansWinterMonths(e.scheduledDate, e.dateTo);
      if (spanWinter) return false;
    }
    return true;
  });
}

function spansWinterMonths(from: Date, to: Date): boolean {
  let d = new Date(from);
  const end = to.getTime();
  while (d.getTime() <= end) {
    if (isWinterDormancyMonthUtc(d.getUTCMonth())) return true;
    d.setUTCDate(d.getUTCDate() + 7);
  }
  return false;
}
