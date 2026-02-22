/**
 * Lunar calendar for gardeners
 * Moon phase calculation + planting recommendations + Russian folk calendar
 */

export type MoonPhase = "new" | "waxing" | "full" | "waning";
export type MoonSign =
  | "aries" | "taurus" | "gemini" | "cancer"
  | "leo" | "virgo" | "libra" | "scorpio"
  | "sagittarius" | "capricorn" | "aquarius" | "pisces";

export interface LunarDay {
  date: Date;
  dayOfMonth: number;
  moonAge: number;
  phase: MoonPhase;
  phaseLabel: string;
  phaseEmoji: string;
  sign: MoonSign;
  signLabel: string;
  signEmoji: string;
  fertility: "high" | "medium" | "low" | "barren";
  fertilityLabel: string;
  recommended: string[];
  avoid: string[];
  folkNote: string | null;
}

const MOON_PHASE_LABELS: Record<MoonPhase, string> = {
  new: "Новолуние",
  waxing: "Растущая",
  full: "Полнолуние",
  waning: "Убывающая",
};

const MOON_PHASE_EMOJI: Record<MoonPhase, string> = {
  new: "🌑",
  waxing: "🌓",
  full: "🌕",
  waning: "🌗",
};

const SIGN_CONFIG: Record<MoonSign, { label: string; emoji: string; fertility: "high" | "medium" | "low" | "barren" }> = {
  aries:       { label: "Овен",       emoji: "♈", fertility: "barren" },
  taurus:      { label: "Телец",      emoji: "♉", fertility: "high" },
  gemini:      { label: "Близнецы",   emoji: "♊", fertility: "barren" },
  cancer:      { label: "Рак",        emoji: "♋", fertility: "high" },
  leo:         { label: "Лев",        emoji: "♌", fertility: "barren" },
  virgo:       { label: "Дева",       emoji: "♍", fertility: "medium" },
  libra:       { label: "Весы",       emoji: "♎", fertility: "medium" },
  scorpio:     { label: "Скорпион",   emoji: "♏", fertility: "high" },
  sagittarius: { label: "Стрелец",    emoji: "♐", fertility: "low" },
  capricorn:   { label: "Козерог",    emoji: "♑", fertility: "medium" },
  aquarius:    { label: "Водолей",    emoji: "♒", fertility: "barren" },
  pisces:      { label: "Рыбы",       emoji: "♓", fertility: "high" },
};

const FERTILITY_LABELS: Record<string, string> = {
  high: "Плодородный",
  medium: "Средний",
  low: "Малоплодородный",
  barren: "Бесплодный",
};

const KNOWN_NEW_MOON = new Date(2024, 0, 11, 11, 57);
const SYNODIC_MONTH = 29.53058867;

function getMoonAge(date: Date): number {
  const diff = (date.getTime() - KNOWN_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24);
  const age = diff % SYNODIC_MONTH;
  return age < 0 ? age + SYNODIC_MONTH : age;
}

function getPhase(moonAge: number): MoonPhase {
  if (moonAge < 1 || moonAge > 28.5) return "new";
  if (moonAge < 14.25) return "waxing";
  if (moonAge < 15.75) return "full";
  return "waning";
}

function getMoonSign(date: Date): MoonSign {
  const signs: MoonSign[] = [
    "aries", "taurus", "gemini", "cancer", "leo", "virgo",
    "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
  ];
  const epoch = new Date(2024, 0, 1);
  const daysSinceEpoch = (date.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24);
  const siderealMonth = 27.321661;
  const moonLongitude = ((daysSinceEpoch / siderealMonth) * 360) % 360;
  const signIndex = Math.floor(((moonLongitude < 0 ? moonLongitude + 360 : moonLongitude) / 30)) % 12;
  return signs[signIndex];
}

type Season = "winter" | "early_spring" | "spring" | "late_spring" | "summer" | "late_summer" | "autumn" | "late_autumn";

function getSeason(month: number): Season {
  if (month === 12 || month === 1) return "winter";
  if (month === 2) return "early_spring";
  if (month === 3) return "spring";
  if (month === 4) return "late_spring";
  if (month === 5 || month === 6) return "summer";
  if (month === 7 || month === 8) return "late_summer";
  if (month === 9 || month === 10) return "autumn";
  return "late_autumn";
}

function getRecommendations(phase: MoonPhase, sign: MoonSign, fertility: string, month: number): { recommended: string[]; avoid: string[] } {
  const recommended: string[] = [];
  const avoid: string[] = [];
  const season = getSeason(month);

  if (phase === "new") {
    avoid.push("Любые посевы и посадки");
    switch (season) {
      case "winter":
        recommended.push("Планирование посадок на сезон", "Изучение сортов, заказ семян", "Ревизия запасов и инвентаря");
        break;
      case "early_spring":
        recommended.push("Проверка семян на всхожесть", "Подготовка ёмкостей для рассады", "Планирование грядок");
        break;
      case "spring":
        recommended.push("Уборка участка от мусора", "Проверка теплицы", "Санитарная обрезка деревьев");
        break;
      case "late_spring":
        recommended.push("Прополка сорняков", "Рыхление междурядий", "Санитарная обрезка");
        break;
      case "summer":
        recommended.push("Прополка и рыхление", "Удаление больных растений", "Ремонт опор и шпалер");
        break;
      case "late_summer":
        recommended.push("Прополка", "Планирование осенних посадок", "Подготовка хранилищ");
        break;
      case "autumn":
        recommended.push("Уборка ботвы", "Очистка грядок", "Подготовка компоста");
        break;
      case "late_autumn":
        recommended.push("Ревизия инвентаря", "Утепление растений", "Закладка компоста");
        break;
    }
    return { recommended, avoid };
  }

  if (phase === "full") {
    avoid.push("Посадки и пересадки", "Обрезка деревьев");
    switch (season) {
      case "winter":
        recommended.push("Изучение лунного календаря", "Подготовка плана участка", "Проверка заготовок");
        break;
      case "early_spring":
        recommended.push("Подкормка рассады (если посеяна)", "Проветривание рассады");
        break;
      case "spring":
      case "late_spring":
        recommended.push("Подкормки внекорневые", "Полив рассады");
        break;
      case "summer":
      case "late_summer":
        recommended.push("Сбор урожая наземных плодов", "Сбор лекарственных трав", "Внекорневые подкормки");
        break;
      case "autumn":
        recommended.push("Сбор позднего урожая", "Заготовки на зиму", "Сушка трав и ягод");
        break;
      case "late_autumn":
        recommended.push("Проверка укрытий растений", "Закладка продуктов на хранение");
        break;
    }
    return { recommended, avoid };
  }

  // Waxing moon
  if (phase === "waxing") {
    avoid.push("Корнеплоды и луковичные");
    switch (season) {
      case "winter":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Посев на рассаду: перец, баклажаны (конец января–февраль)");
          recommended.push("Замачивание семян для проверки всхожести");
        } else {
          recommended.push("Подготовка грунта для рассады", "Закупка удобрений");
        }
        break;
      case "early_spring":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Посев томатов, перца, баклажанов на рассаду");
          recommended.push("Посев цветов на рассаду (петуния, бархатцы)");
        } else {
          recommended.push("Подготовка тары для рассады", "Досветка рассады");
        }
        break;
      case "spring":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Посев капусты, томатов на рассаду", "Пикировка рассады");
          recommended.push("Подготовка теплицы");
        } else {
          recommended.push("Закаливание рассады", "Проветривание теплицы");
        }
        break;
      case "late_spring":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Высадка рассады в грунт/теплицу", "Посев зелени и салатов");
          recommended.push("Пересадка рассады огурцов, кабачков");
        } else {
          recommended.push("Рыхление и прополка", "Установка опор и шпалер");
        }
        break;
      case "summer":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Повторный посев зелени", "Пасынкование томатов");
          recommended.push("Подкормка овощных культур", "Полив тёплой водой");
        } else {
          recommended.push("Прополка и рыхление", "Мульчирование грядок");
        }
        break;
      case "late_summer":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Посев сидератов", "Посев дайкона и редьки");
          recommended.push("Подкормка плодовых деревьев");
        } else {
          recommended.push("Сбор семян", "Прореживание загущённых посадок");
        }
        break;
      case "autumn":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Посадка озимого чеснока", "Посев сидератов");
          recommended.push("Посадка саженцев плодовых (до заморозков)");
        } else {
          recommended.push("Уборка ботвы", "Подготовка грядок к зиме");
        }
        break;
      case "late_autumn":
        recommended.push("Подзимний посев моркови, петрушки", "Укрытие грядок мульчёй");
        break;
    }
  }

  // Waning moon
  if (phase === "waning") {
    avoid.push("Пересадка рассады наземных культур");
    switch (season) {
      case "winter":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Яровизация картофеля (достать на свет)");
          recommended.push("Проверка клубней и луковиц в хранилище");
        } else {
          recommended.push("Чистка и дезинфекция инвентаря", "Планирование севооборота");
        }
        break;
      case "early_spring":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Посев корнеплодов на раннюю рассаду (сельдерей)");
          recommended.push("Подготовка клубней картофеля к яровизации");
        } else {
          recommended.push("Проверка запасов удобрений", "Обработка инвентаря");
        }
        break;
      case "spring":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Обрезка плодовых деревьев (до сокодвижения)", "Посев моркови, редиса в грунт");
        } else {
          recommended.push("Побелка стволов деревьев", "Уборка растительного мусора");
        }
        break;
      case "late_spring":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Посадка картофеля", "Посев моркови, свёклы, лука");
          recommended.push("Посадка луковичных цветов");
        } else {
          recommended.push("Окучивание картофеля", "Борьба с вредителями");
        }
        break;
      case "summer":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Окучивание картофеля", "Подкормка корнеплодов");
          recommended.push("Полив и рыхление лука и чеснока");
        } else {
          recommended.push("Борьба с вредителями и болезнями", "Покос травы");
        }
        break;
      case "late_summer":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Уборка картофеля, лука, чеснока", "Сбор корнеплодов");
          recommended.push("Закладка урожая на хранение");
        } else {
          recommended.push("Обработка от вредителей", "Компостирование ботвы");
        }
        break;
      case "autumn":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Посадка озимого чеснока", "Уборка поздних корнеплодов");
          recommended.push("Внесение органических удобрений в почву");
        } else {
          recommended.push("Перекопка пустых грядок", "Уборка растительных остатков");
        }
        break;
      case "late_autumn":
        if (fertility === "high" || fertility === "medium") {
          recommended.push("Подзимняя посадка чеснока (до промерзания)", "Мульчирование грядок");
        } else {
          recommended.push("Защита стволов от грызунов", "Финальная уборка участка");
        }
        break;
    }
  }

  // Zodiac sign additions (season-appropriate)
  const isOutdoorSeason = month >= 4 && month <= 10;
  switch (sign) {
    case "cancer":
    case "scorpio":
    case "pisces":
      if (month >= 2 && month <= 4) recommended.push("Замачивание семян перед посевом");
      if (isOutdoorSeason) recommended.push("Обильный полив");
      break;
    case "taurus":
    case "virgo":
    case "capricorn":
      if (isOutdoorSeason) recommended.push("Работа с многолетниками и кустарниками");
      else if (month >= 1 && month <= 3) recommended.push("Подготовка почвосмесей для рассады");
      break;
    case "aries":
    case "leo":
    case "sagittarius":
      if (isOutdoorSeason) recommended.push("Обработка от вредителей и болезней");
      else recommended.push("Проверка средств защиты растений");
      break;
    case "gemini":
    case "libra":
    case "aquarius":
      if (month >= 7 && month <= 9) recommended.push("Сбор семян для будущего сезона");
      if (isOutdoorSeason) recommended.push("Декоративные работы на участке");
      break;
  }

  return { recommended, avoid };
}

const FOLK_CALENDAR: Record<string, string> = {
  "01-14": "Старый Новый год. Примета: если ясно — к хорошему урожаю",
  "01-25": "Татьянин день. Снег — к дождливому лету, солнце — к раннему прилёту птиц",
  "02-15": "Сретение. Тепло — к ранней весне, холод — весна затянется",
  "02-24": "Власьев день — начало скотьих праздников. Оттепель — к ранней весне",
  "03-14": "Евдокия (Авдотья Весновка). Тёплый день — к тёплому лету и хорошему урожаю хлеба",
  "03-22": "Сорок мучеников. Сорок утренников до тепла. Если тепло — к дружной весне",
  "03-30": "Алексей — с гор вода. Если земля промёрзлая — к плохому урожаю",
  "04-07": "Благовещение. До этого дня нельзя тревожить землю. Если тепло — весна будет ранняя",
  "04-12": "Иоанн Лествичник. Начинают сеять горох, когда «земля парит»",
  "04-18": "Федул-тёплый. Начинают пахать. «Пришёл Федул — тёплый ветер подул»",
  "05-06": "Егорий (Юрьев день). Выгон скота. Если утром роса — к урожаю. Начало серьёзных посадок",
  "05-11": "Мокей Мокрый. Если дождь — всё лето мокрое",
  "05-15": "Борис и Глеб Сеятели. Время сева. «Борис и Глеб сеют хлеб»",
  "05-19": "Иов Росенник. Много росы — к урожаю огурцов",
  "05-22": "Никола Весенний. Сажают картофель. «До Николы не сей гречки, не стриги овечки»",
  "06-02": "Фалалей-огуречник. Массовый посев огурцов",
  "06-11": "Федосья-колосяница. Начало колошения ржи. Тёплый ветер — к урожаю",
  "06-22": "Кирилл. Самый длинный день. Конец посадок. «На Кирилла — от земли сила»",
  "06-25": "Пётр Поворот. Солнце «поворачивает» на зиму, а жара — на лето",
  "07-07": "Иван Купала. Собирают лечебные травы. Роса целебная",
  "07-12": "Пётр и Павел. «Петров день — красное лето». Начало сенокоса",
  "07-21": "Казанская. Начинают уборку озимых. «На Казанскую зёрнышко в колосу»",
  "08-02": "Ильин день. «С Ильина дня купаться нельзя — вода холодеет». Начало уборки урожая",
  "08-14": "Медовый Спас. Начинают качать мёд. Малина и яблони в зените плодоношения",
  "08-19": "Яблочный Спас. Освящение яблок. Массовый сбор яблок",
  "08-28": "Успение. «Молодое бабье лето». Убирают картофель, сеют озимые",
  "08-29": "Ореховый (Хлебный) Спас. Пекут хлеб из нового зерна. Заготовка орехов",
  "09-01": "Андрей Стратилат. Осенний тепляк. «Тёплый ветер — к тёплой осени»",
  "09-08": "Наталья-Овсянница. Косят овёс. «Пётр и Павел час убавил — Наталья овёс обмолотила»",
  "09-14": "Семён Летопроводец. Начало бабьего лета. Если тепло — к хорошей осени",
  "09-21": "Рождество Богородицы. Конец бабьего лета. Луковки тюльпанов пора сажать",
  "09-27": "Воздвижение. «На Воздвижение первая барыня — капуста». Рубят капусту",
  "10-01": "Арина-журавлиный лёт. Улетают журавли — через 2 недели мороз",
  "10-14": "Покров. Первый снег. Начинают укрывать многолетники на зиму",
  "11-04": "Казанская осенняя. «Казанская морозам дорогу кажет». Готовят сад к зиме",
  "11-14": "Кузьминки. «Кузьма и Демьян — куриный праздник». Подзимний посев моркови и чеснока",
  "11-21": "Михаил Архангел. Если снег — к зиме, если грязь — ещё будет слякоть",
  "12-04": "Введение. «Если с Введения ляжет снег — до весны не стает»",
  "12-13": "Андрей Первозванный. Гадание на урожай: если прислушаться к воде — тихая к мягкой зиме",
  "12-22": "Анна Тёмная. Самый короткий день. С этого дня «день прибавляется на куриный шажок»",
};

function getFolkNote(date: Date): string | null {
  const key = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return FOLK_CALENDAR[key] || null;
}

export function getLunarDay(date: Date): LunarDay {
  const moonAge = getMoonAge(date);
  const phase = getPhase(moonAge);
  const sign = getMoonSign(date);
  const signConfig = SIGN_CONFIG[sign];
  const { recommended, avoid } = getRecommendations(phase, sign, signConfig.fertility, date.getMonth() + 1);

  return {
    date,
    dayOfMonth: date.getDate(),
    moonAge: Math.round(moonAge * 10) / 10,
    phase,
    phaseLabel: MOON_PHASE_LABELS[phase],
    phaseEmoji: MOON_PHASE_EMOJI[phase],
    sign,
    signLabel: signConfig.label,
    signEmoji: signConfig.emoji,
    fertility: signConfig.fertility,
    fertilityLabel: FERTILITY_LABELS[signConfig.fertility],
    recommended,
    avoid,
    folkNote: getFolkNote(date),
  };
}

export function getMonthLunarDays(year: number, month: number): LunarDay[] {
  const days: LunarDay[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(getLunarDay(new Date(year, month - 1, d)));
  }
  return days;
}

export const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const monthNamesGen = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
