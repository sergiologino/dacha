/** Дополнительные факты (новые). */
export const EXTRA_FUN_FACTS: {
  slug: string;
  categorySlug: string;
  emoji: string;
  title: string;
  text: string;
  sortOrder: number;
}[] = [
  { slug: "fact-rhubarb-leaves", categorySlug: "science", emoji: "🌿", title: "Листья ревеня ядовиты", text: "В пищу идут только черешки: в листьях много щавелевой кислоты и её солей — не используйте их в заготовках.", sortOrder: 100 },
  { slug: "fact-green-potatoes", categorySlug: "science", emoji: "🥔", title: "Зелёный картофель и соланин", text: "Позеленение клубня на свету — накопление соланина; такие участки лучше вырезать или не есть сырыми.", sortOrder: 101 },
  { slug: "fact-fig-flower-inside", categorySlug: "science", emoji: "🌳", title: "Инжир — цветок внутри плода", text: "Съедобная часть инжира — перевёрнутый соцветие с мелкими цветками внутри полости.", sortOrder: 102 },
  { slug: "fact-cranberry-bounce", categorySlug: "harvest", emoji: "🫐", title: "Клюква отскакивает, если свежая", text: "Из-за плотной кожицы зрелая ягода подпрыгивает при отбрасывании — старый приём отбора на болоте.", sortOrder: 103 },
  { slug: "fact-wasabi-rare", categorySlug: "world", emoji: "🌶️", title: "Настоящий васаби редок", text: "Большую часть «васаби» в тюбиках имитирует хрен с красителем; настоящий Wasabia japonica растёт в холодной воде.", sortOrder: 104 },
  { slug: "fact-vanilla-orchid", categorySlug: "plants", emoji: "🌸", title: "Ваниль — орхидея", text: "Стручки ванили получают с лианы Vanilla planifolia; опыление часто ручное на плантациях.", sortOrder: 105 },
  { slug: "fact-cacao-bitter", categorySlug: "history", emoji: "🍫", title: "Какао пили как горький напиток", text: "До сахара какао-бобы растирали с водой и специями — напиток майя и ацтеков был не сладким.", sortOrder: 106 },
  { slug: "fact-artichoke-flower", categorySlug: "plants", emoji: "🌼", title: "Артишок — незрелый цветок", text: "Едят головку до распускания сиренево-голубых лепестков; если оставить — вырастет крупный васильковый цветок.", sortOrder: 107 },
  { slug: "fact-kohlrabi-stem", categorySlug: "plants", emoji: "🥬", title: "Кольраби раздувает стебель", text: "Съедобный шар — утолщённое основание стебля, а не корень; листья тоже годятся в суп.", sortOrder: 108 },
  { slug: "fact-pea-flowers-edible", categorySlug: "plants", emoji: "🌸", title: "Цветы гороха съедобны", text: "Нежные цветки и побеги гороха добавляют в салаты; не срывайте все, если нужен урожай бобов.", sortOrder: 109 },
  { slug: "fact-mushroom-not-plant", categorySlug: "science", emoji: "🍄", title: "Грибы — не растения", text: "Грибы выделены в отдельное царство; их клеточная стенка из хитина, как у насекомых.", sortOrder: 110 },
  { slug: "fact-lichens-symbiosis", categorySlug: "science", emoji: "🪨", title: "Лишайник — симбиоз", text: "Это гриб + водоросль или цианобактерия; лишайники первыми колонизируют голый камень.", sortOrder: 111 },
  { slug: "fact-sequoia-volume", categorySlug: "records", emoji: "🌲", title: "Секвойядендрон — объёмный гигант", text: "Общий объём древесины у крупнейших экземпляров секвойи превышает любое одиночное дерево по массе ствола.", sortOrder: 112 },
  { slug: "fact-rose-family-fruits", categorySlug: "plants", emoji: "🍎", title: "Яблоня, малина и роза — родственники", text: "Все они в семействе розоцветных, хотя плоды устроены по-разному.", sortOrder: 113 },
  { slug: "fact-blackcurrant-vitamin-c", categorySlug: "harvest", emoji: "🫐", title: "Чёрная смородина богата витамином C", text: "По содержанию аскорбиновой кислоты ягода сопоставима с цитрусовыми на 100 г продукта.", sortOrder: 114 },
  { slug: "fact-horseradish-perennial", categorySlug: "plants", emoji: "🌿", title: "Хрен многолетний", text: "Корень наращивается годами; при посадке ограничивайте площадь — хрен расползается корневищами.", sortOrder: 115 },
  { slug: "fact-sorrel-oxalic", categorySlug: "science", emoji: "🥬", title: "Щавель и щавелевая кислота", text: "В больших количествах щавель нежелателен при некоторых заболеваниях почек; в умеренных порциях — классика весеннего стола.", sortOrder: 116 },
  { slug: "fact-amaranth-grain", categorySlug: "history", emoji: "🌾", title: "Амарант — древняя зерновая", text: "Зёрна амаранта ценились в Мезоамерике; листья тоже съедобны как шпинат.", sortOrder: 117 },
  { slug: "fact-quinoa-chenopod", categorySlug: "plants", emoji: "🌾", title: "Киноа — маревые", text: "Родственница свёклы и шпината; «зёрна» — семена без глютена.", sortOrder: 118 },
  { slug: "fact-teff-small", categorySlug: "world", emoji: "🌾", title: "Теф — самое мелкое зерно", text: "Эфиопская культура; зёрна размером с песчинку, из них пекут инджеру.", sortOrder: 119 },
  { slug: "fact-saffron-stigmas", categorySlug: "records", emoji: "🌷", title: "Шафран — тысячи цветков на грамм", text: "Специя из рылец крокуса; ручной сбор делает её одной из самых дорогих по весу.", sortOrder: 120 },
  { slug: "fact-nutmeg-mace", categorySlug: "science", emoji: "🌰", title: "Мускат и мускатный цвет", text: "Орех мускатный и мускатный цвет — разные части плода одного дерева Myristica fragrans.", sortOrder: 121 },
  { slug: "fact-cinnamon-bark", categorySlug: "plants", emoji: "🪵", title: "Корица — кора", text: "Товарная корица — сушёная внутренняя кора молодых ветвей коричника.", sortOrder: 122 },
  { slug: "fact-clove-buds", categorySlug: "plants", emoji: "🌿", title: "Гвоздика — бутоны", text: "Сухие гвоздичные «гвоздики» — нераскрывшиеся цветки дерева Syzygium aromaticum.", sortOrder: 123 },
  { slug: "fact-pepper-piper", categorySlug: "world", emoji: "🧂", title: "Чёрный перец — не паслёный", text: "Перец чёрный из Piper nigrum не родственен болгарскому и чили.", sortOrder: 124 },
  { slug: "fact-vinegar-acetic", categorySlug: "science", emoji: "🧴", title: "Уксус — продукт бактерий", text: "Уксусная кислота получается окислением этанола уксуснокислыми бактериями; концентрация в столовом уксусе стандартизована.", sortOrder: 125 },
  { slug: "fact-honey-infinite-crystals", categorySlug: "harvest", emoji: "🍯", title: "Мёд кристаллизуется", text: "Засахаривание мёда — норма; мягкий нагрев в бане воды возвращает однородность без кипячения.", sortOrder: 126 },
  { slug: "fact-maple-sap-sugar", categorySlug: "harvest", emoji: "🍁", title: "Клён даёт сок с сахаром", text: "Из весеннего сока сахарного клёна выпаривают сироп; долго варят — получают кленовый сахар.", sortOrder: 127 },
  { slug: "fact-olive-fermentation", categorySlug: "history", emoji: "🫒", title: "Оливки горькие с дерева", text: "Свежий плод горький из-за олеuropeина; горькость снимают рассолом, ферментацией или щёлочью по технологии.", sortOrder: 128 },
  { slug: "fact-citrus-hybrid", categorySlug: "science", emoji: "🍊", title: "Многие цитрусы — гибриды", text: "Апельсин, лимон, мандарин имеют сложную историю скрещиваний в Юго-Восточной Азии.", sortOrder: 129 },
  { slug: "fact-persimmon-tannins", categorySlug: "science", emoji: "🍅", title: "Хурма вяжет из-за танинов", text: "Сорт «королёк» вяжет до полного дозревания или заморозки; восточные сорта часто безъязычные.", sortOrder: 130 },
  { slug: "fact-kiwi-berry", categorySlug: "plants", emoji: "🥝", title: "Киви тоже ягода", text: "Как и томаты и бананы ботанически — ягоды; привычное «киви» — вид Actinidia.", sortOrder: 131 },
  { slug: "fact-pineapple-bromelain", categorySlug: "science", emoji: "🍍", title: "Ананас содержит бромелайн", text: "Фермент размягчает белок — желатин с сырым ананасом иногда не застывает.", sortOrder: 132 },
  { slug: "fact-celery-negative-calories-myth", categorySlug: "science", emoji: "🥬", title: "«Отрицательные калории» у сельдерея — миф", text: "Переваривание тоже тратит энергию, но не больше, чем даёт низкокалорийный стебель.", sortOrder: 133 },
  { slug: "fact-mint-square-stem", categorySlug: "plants", emoji: "🌿", title: "Мята — как все лабиаты", text: "У мяты четырёхгранный стебель и супротивные листья — признаки семейства яснотковых.", sortOrder: 134 },
  { slug: "fact-lavender-drought", categorySlug: "plants", emoji: "💜", title: "Лаванда любит дренаж", text: "Средиземноморские виды гибнут от зимней переувлажнённости на глине без песка.", sortOrder: 135 },
  { slug: "fact-rosemary-woody", categorySlug: "plants", emoji: "🌿", title: "Розмарин — полукустарник", text: "Со временем древеснеет у основания; обрезка после цветения поддерживает форму.", sortOrder: 136 },
  { slug: "fact-thyme-creeping", categorySlug: "plants", emoji: "🌱", title: "Тимьян ползучий — живой ковёр", text: "Подходит для щелей плитки и альпинариев на солнце; не любит затенения и застоя воды.", sortOrder: 137 },
  { slug: "fact-sage-aromatic", categorySlug: "plants", emoji: "🌿", title: "Шалфей держит аромат в трихомах", text: "Мелкие волоски на листьях хранят эфирные масла — поэтому лист крупнее после сухой погоды.", sortOrder: 138 },
  { slug: "fact-chive-perennial", categorySlug: "harvest", emoji: "🧅", title: "Шнитт-лук многолетний", text: "Грядку можно не пересаживать годами; деление куста раз в 3–5 лет омолаживает.", sortOrder: 139 },
];
