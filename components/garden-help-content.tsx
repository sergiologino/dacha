"use client";

/**
 * Текст помощи по странице «Мой участок». Хранится на фронте, открывается без задержек.
 */
export function GardenHelpContent() {
  return (
    <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300">
      <section>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <span className="rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300">1</span>
          Как добавить грядку
        </h3>
        <p className="pl-7">
          Нажмите кнопку <strong>«Новая грядка»</strong> под заголовком «Мой участок». Откроется форма: введите название (например, «Теплица №1»), при желании — номер, выберите <strong>тип грядки</strong>: открытый грунт, теплица, высокая грядка или рассада дома. Тип влияет на рекомендации и шкалу роста. Нажмите <strong>«Создать»</strong> — грядка появится в списке.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <span className="rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300">2</span>
          Как добавить культуру на грядку
        </h3>
        <p className="pl-7 mb-2">
          На карточке грядки нажмите <strong>«Добавить растение»</strong>. Есть два способа выбора культуры:
        </p>
        <ul className="pl-7 list-disc space-y-1 ml-2">
          <li>
            <strong>Поиск</strong> — введите от 3 букв в поле (название или сорт, например «томат» или «черри»). Из выпадающего списка выберите нужную культуру и сорт, при необходимости укажите дату посадки и нажмите «Добавить».
          </li>
          <li>
            <strong>По категории</strong> — выберите категорию (Овощи, Ягоды и т.д.), затем культуру и сорт. Укажите дату посадки (по умолчанию — сегодня) и нажмите «Добавить».
          </li>
        </ul>
        <p className="pl-7 mt-2">
          Имя растения будет ссылкой на описание в справочнике, если культура выбрана из каталога.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <span className="rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300">3</span>
          Шкала роста
        </h3>
        <p className="pl-7 mb-2">
          Под каждым растением отображается <strong>шкала роста</strong> — от даты посадки до ориентировочного урожая. Её можно рассчитать кнопкой <strong>«Рассчитать таймлайн ухода»</strong>, если шкала ещё не построена.
        </p>
        <p className="pl-7 mb-2">На шкале отображаются точки:</p>
        <ul className="pl-7 list-disc space-y-1 ml-2">
          <li>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Зелёные</span> — плановые события ухода (всходы, полив, рыхление, пересадка, урожай). Нажмите на точку — под шкалой появится дата и описание.
          </li>
          <li>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Синие</span> — фото растения с вердиктом «всё в норме». Нажмите — увидите краткий вывод нейросети.
          </li>
          <li>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Красные</span> — фото с вердиктом «есть отклонения» и рекомендациями, что делать.
          </li>
        </ul>
        <p className="pl-7 mt-2">
          Оранжевая вертикальная черта на шкале — <strong>сегодня</strong>. Под шкалой также выводятся ближайшие действия и ожидаемые события.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          <span className="rounded bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 text-emerald-700 dark:text-emerald-300">4</span>
          Фотографирование растения
        </h3>
        <p className="pl-7 mb-2">
          У каждого растения есть кнопка с иконкой <strong>камеры</strong>. Нажмите её — можно сделать снимок или выбрать фото с устройства. После загрузки приложение отправит фото нейросети с учётом даты посадки, названия культуры и типа грядки.
        </p>
        <p className="pl-7 mb-2">
          Нейросеть оценит, соответствует ли развитие растения ожидаемому на эту дату. Результат: <strong>синяя точка</strong> (всё хорошо) или <strong>красная точка</strong> (есть отклонения и рекомендации) на шкале роста по дате съёмки. Тот же вердикт можно посмотреть при открытии фото в галерее — он отображается под изображением.
        </p>
        <p className="pl-7">
          Миниатюры фото отображаются над шкалой; по нажатию открывается полноэкранная галерея с переключением и текстом вердикта.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
          Дополнительно
        </h3>
        <ul className="pl-7 list-disc space-y-1 ml-2">
          <li>Дату посадки можно изменить — нажмите на дату в строке растения и выберите новую.</li>
          <li>Растения без грядки отображаются отдельным блоком внизу списка.</li>
          <li>Удаление: кнопка с иконкой корзины у растения или у грядки.</li>
        </ul>
      </section>
    </div>
  );
}
