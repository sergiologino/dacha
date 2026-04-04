/**
 * Лайфхаки и народные приёмы для раздела «Справочник».
 *
 * Редакция: раз в неделю добавляйте в этот массив 5–10 новых объектов с уникальным `id`
 * и рабочей `imageUrl` (лучше upload.wikimedia.org — уже разрешён в next.config).
 * Подборка на странице /guide формируется автоматически из пула по номеру ISO-недели.
 */
import { getISOWeek, getISOWeekYear } from "date-fns";

export type GuideHackCategory =
  | "огород и теплица"
  | "участок и обустройство"
  | "обработка и уход"
  | "народные методы";

export interface GuideHack {
  id: string;
  title: string;
  text: string;
  category: GuideHackCategory;
  imageUrl: string;
  imageAlt: string;
}

/** Сколько карточек показывать в блоке «неделя» (в диапазоне 5–10). */
export const WEEKLY_GUIDE_HACK_COUNT = 8;

export const GUIDE_HACKS: GuideHack[] = [
  {
    id: "hack-shell-calcium",
    title: "Яичная скорлупа вместо покупной извести",
    text: "Высушите скорлупу, разомните в крошку или перемелите на кофемолке и вмешайте в почву при перекопке или добавьте в лунку под рассаду. Кальций медленно отдаётся растениям и помогает предотвратить вершинную гниль у томатов и перца. На кислых почвах не заменяет доломит, но как добавка полезна.",
    category: "огород и теплица",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Eggshell_membrane.jpg/640px-Eggshell_membrane.jpg",
    imageAlt: "Куски яичной скорлупы крупным планом",
  },
  {
    id: "hack-coffee-grounds",
    title: "Кофейная гуща на грядку",
    text: "Остывшую гущу вносят в компост или тонким слоем под мульчу вокруг ягод и кустов. Органика и микроэлементы стимулируют почвенную жизнь; важно не переборщить: кофе слегка подкисляет среду — для клубники и роз часто к месту, для известковых любителей — умеренно.",
    category: "огород и теплица",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Coffee_beans_in_burlap_bags.jpg/640px-Coffee_beans_in_burlap_bags.jpg",
    imageAlt: "Кофейные зёрна в мешковине",
  },
  {
    id: "hack-wood-ash",
    title: "Древесная зола против слизней и для подкормки",
    text: "Просеянную золу рассыпают тонкой полосой вдоль грядок: слизни не любят сухую щёлочную кромку. Вносят и как источник калия и фосфора под корнеплоды после анализа почвы: на кислых участках эффект заметнее, на щелочных — экономьте золу.",
    category: "народные методы",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Wood_ash_from_fireplace.jpg/640px-Wood_ash_from_fireplace.jpg",
    imageAlt: "Древесная зола",
  },
  {
    id: "hack-bread-yeast-spray",
    title: "Хлебный настой как мягкий стимулятор",
    text: "Небольшой кусок дрожжевого хлеба или 1 ч. л. сухих дрожжей разводят в тёплой воде с ложкой сахара, настаивают 2–3 часа, процеживают и разбавляют ведром воды. Поливают под корень утром не чаще раза в две недели в период роста — источник микроэлементов и органики; не путать с полноценной минеральной подкормкой.",
    category: "народные методы",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Saccharomyces_cerevisiae_SEM.jpg/640px-Saccharomyces_cerevisiae_SEM.jpg",
    imageAlt: "Дрожжи под микроскопом",
  },
  {
    id: "hack-onion-peel-decoction",
    title: "Отвар луковой шелухи от рассады до полива",
    text: "Шелуху лука заливают водой, кипят сорок минут, охлаждают и разбавляют чистой водой 1:5. Используют для замачивания семян (10–12 ч), полива рассады или опрыскивания: флавоноиды мягко подавляют грибковую микрофлору. Перед обработкой всей грядки проверьте реакцию на паре листьев.",
    category: "обработка и уход",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Mixed_onions.jpg/640px-Mixed_onions.jpg",
    imageAlt: "Луковицы разных сортов",
  },
  {
    id: "hack-nettle-manure",
    title: "Крапивое удобрение (настой)",
    text: "Молодую крапиву без семян укладывают в бочку, заливают водой на четверть выше, накрывают марлей. Через 10–14 дней брожения разбавляют водой 1:10 и поливают капусту, томаты, огурцы. Азот и микроэлементы; запах сильный — бочку держите подальше от дома.",
    category: "огород и теплица",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Urtica_dioica_koehler.jpg/640px-Urtica_dioica_koehler.jpg",
    imageAlt: "Растение крапива",
  },
  {
    id: "hack-banana-potassium",
    title: "Банановая кожура для калия",
    text: "Высушите кожуру, измельчите и вносите в лунки при посадке томатов и цветков или добавьте в компост. Калий помогает завязи и окраске плодов; избыток «банана» не заменит полный состав удобрений.",
    category: "огород и теплица",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Banana_peels.jpg/640px-Banana_peels.jpg",
    imageAlt: "Банановая кожура",
  },
  {
    id: "hack-bottle-drip",
    title: "Капельный полив из пластиковой бутылки",
    text: "В крышке бутылки прокалывают 1–3 отверстия иглой, перевёрнутую бутылку закапывают у корня на 15–20 см. Наполняют водой — влага уходит сутками, корни тянутся вглубь. Удобно для теплицы и контейнеров в отпускной сезон.",
    category: "участок и обустройство",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Drip_irrigation_in_Har_Nof%2C_Jerusalem.jpg/640px-Drip_irrigation_in_Har_Nof%2C_Jerusalem.jpg",
    imageAlt: "Капельный полив на грядке",
  },
  {
    id: "hack-compost-lasagna",
    title: "Многослойный компост на месте грядки",
    text: "На газоне или жёстком участке укладывают картон, слой органики, земли, снова органику — как слоёный пирог. За сезон материал проседает, почва рыхлеет, черви подтягиваются сами. Подходит для новых грядок без тяжёлой лопаты.",
    category: "участок и обустройство",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Compost_-_panoramio.jpg/640px-Compost_-_panoramio.jpg",
    imageAlt: "Комостная куча на участке",
  },
  {
    id: "hack-mustard-green-manure",
    title: "Горчица сидератом вместо «запрещённой химии»",
    text: "Белую или сарептскую горчицу сеют густо после уборки ранних культур, через 5–6 недель сакатывают или заделывают. Корни разрыхляют почву, биомасса подавляет часть почвенных вредителей и готовит грядку к весне.",
    category: "огород и теплица",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Brassica_nigra_plant.jpg/640px-Brassica_nigra_plant.jpg",
    imageAlt: "Растение горчицы с жёлтыми цветами",
  },
  {
    id: "hack-pine-needles-acid",
    title: "Хвоя и дёготь для кислой клумбы",
    text: "Сухую хвою мельчают и добавляют в субстрат для черники, брусники и рододендронов; перепревшая хвоя держит pH ниже нейтрали. Смолистый запах отпугивает муравьёв на дорожках — укладывают полосами.",
    category: "участок и обустройство",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Pinus_sylvestris_cones.jpg/640px-Pinus_sylvestris_cones.jpg",
    imageAlt: "Шишки и хвоя сосны",
  },
  {
    id: "hack-straw-mulch",
    title: "Соломенная мульча против сорняков и перегрева",
    text: "Слой соломы 8–12 см у корней томатов, кабачков и ягодников снижает испарение и подавляет сорняки. Влага после полива держится дольше; под соломой не формируется корка после дождя.",
    category: "огород и теплица",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Straw_bale.jpg/640px-Straw_bale.jpg",
    imageAlt: "Тюки соломы",
  },
  {
    id: "hack-vinegar-path",
    title: "Уксус по бордюрам против спорных сорняков",
    text: "9% уксус разбавляют водой 1:1 и точечно обрабатывают щели в плитке и щели дорожек в жару. Обжигает листья сорняков; не брызгайте на культурные растения и не злоупотребляйте — микрожизнь почвы тоже чувствительна.",
    category: "участок и обустройство",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/White_vinegar.jpg/640px-White_vinegar.jpg",
    imageAlt: "Бутылка белого уксуса",
  },
  {
    id: "hack-rain-barrel",
    title: "Сбор дождевой воды с крыши",
    text: "Вода без хлора мягче для полива рассады и комнатных растений. Добавьте сетку от листьев и перелив; первые минуты дождя сливают в сторону — смывает пыль с кровли. Ёмкость прикрывают от комаров и водоплавающего мусора.",
    category: "участок и обустройство",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Rainwater_Harvesting_-_Auroville.jpg/640px-Rainwater_Harvesting_-_Auroville.jpg",
    imageAlt: "Сбор дождевой воды в цистерну",
  },
  {
    id: "hack-pallet-bed",
    title: "Высокая грядка из поддонов без пилы",
    text: "Чистые EUR-паллеты выкладывают двойным контуром, внутрь укладывают картон на дно, затем ветки, компост и землю. Удобно спине, быстро обогревается весной. Проверьте маркировку: не используйте обработанные метилбромидом импортные поддоны.",
    category: "участок и обустройство",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Wooden_pallets_stacked.jpg/640px-Wooden_pallets_stacked.jpg",
    imageAlt: "Стопка деревянных поддонов",
  },
  {
    id: "hack-garlic-soak",
    title: "Замачивание чеснока перед озимой посадкой",
    text: "Зубчики на час-два опускают в слабый раствор марганцовки или настой золы, затем на сутки в слегка подогретую воду — пробуждают ростки, снижают риск гнили в холодной земле. Высушите перед высадкой.",
    category: "огород и теплица",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Allium_sativum_Woodwill_1793.jpg/640px-Allium_sativum_Woodwill_1793.jpg",
    imageAlt: "Иллюстрация чеснока",
  },
  {
    id: "hack-nasturtium-trap",
    title: "Настурция-«ловушка» для тли",
    text: "Пахучую настурцию сеют по краю теплицы и грядок: тля часто садится на неё раньше, чем на томаты. Поражённые кусты вырывают и уничтожают — дешёвый индикатор и приманка.",
    category: "обработка и уход",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/TropaeolumMajusOrange.jpg/640px-TropaeolumMajusOrange.jpg",
    imageAlt: "Оранжевая настурция",
  },
  {
    id: "hack-wood-chip-path",
    title: "Тропинка из щепы без бетона",
    text: "На утрамбованный грунт кладут геотекстиль и 10–15 см древесных щепок; за год материал оседает и спекается в удобную бурую дорожку. Воду пропускает, сорняк почти не пробивается, выглядит органично.",
    category: "участок и обустройство",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Woodchips_-_Massachusetts.jpg/640px-Woodchips_-_Massachusetts.jpg",
    imageAlt: "Дорожка из древесной щепы",
  },
  {
    id: "hack-vermicompost-bins",
    title: "Вермикомпост в ящике на балконе или в подвале",
    text: "Червь старатель (Eisenia fetida) перерабатывает кухонные отходы в «чай» и гумус без запаха при правильной влажности. Контейнер с отверстиями, слоями картона и пищевыми отходами без цитрусов и лука — готовый подкормочный отстой через 2–3 месяца работы.",
    category: "народные методы",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Worm_compost_6.jpg/640px-Worm_compost_6.jpg",
    imageAlt: "Вермикомпост с червями",
  },
  {
    id: "hack-marigold-nematodes",
    title: "Бархатцы как барьер от нематод",
    text: "Тагетес выделяют вещества, подавляющие часть видов галловых нематод в почве. Сеют плотной лентой перед клубникой или после картофеля на участках с историей «узелков» на корнях. Это помощник, не панацея при тяжёлом заражении.",
    category: "обработка и уход",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Tagetes_erecta_chendumalli_chedi.jpg/640px-Tagetes_erecta_chendumalli_chedi.jpg",
    imageAlt: "Бархатцы оранжевые",
  },
];

function stableMixKey(id: string, year: number, week: number): number {
  const s = `${id}:${year}-W${week}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Подборка на текущую ISO-неделю: стабильный набор карточек, меняется раз в неделю. */
export function getWeeklyGuideHacks(now: Date = new Date()): GuideHack[] {
  const year = getISOWeekYear(now);
  const week = getISOWeek(now);
  if (GUIDE_HACKS.length === 0) return [];
  const n = Math.min(WEEKLY_GUIDE_HACK_COUNT, GUIDE_HACKS.length);
  const sorted = [...GUIDE_HACKS].sort(
    (a, b) => stableMixKey(a.id, year, week) - stableMixKey(b.id, year, week)
  );
  return sorted.slice(0, n);
}

export function guideHackCategories(): GuideHackCategory[] {
  return [
    "огород и теплица",
    "участок и обустройство",
    "обработка и уход",
    "народные методы",
  ];
}
