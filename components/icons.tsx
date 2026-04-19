export function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

/** Логотип Telegram (упрощённо), для кнопок обратной связи. */
export function TelegramBrandIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        fill="#fff"
        d="M5.5 12.5c1.7-.7 3.6-1.5 6.8-2.8 2.4-1 5.8-2.4 5.8-2.4s.5-.1.5.5c0 .3-.2 1-.4 1.8-.7 3.1-2.4 10.5-2.4 10.5s-.2.7-.7.8c-.6.1-1.5-.4-2.1-.8-1.2-.8-2.1-1.3-3.3-2.1-1.8-1.2-.6-1.9.4-2.9.3-.3 5.6-5.2 5.7-5.7 0-.1 0-.4-.4-.3-.2 0-3.4 2.2-9.6 6.5-.9.6-1.7.9-2.4.9-.8 0-2.3-.4-3.4-.8-1.4-.5-2.4-.8-2.3-1.6.1-.4.5-.8 1.1-1.1z"
      />
    </svg>
  );
}

/** Стильзованная иконка мессенджера MAX (условные фирменные цвета, без gradient id — можно несколько на странице). */
export function MaxMessengerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <rect width="24" height="24" rx="6" fill="#6B4DE8" />
      <path
        fill="#fff"
        d="M6.5 7.5h2.2v9H6.5v-9zm4.3 2.2h2.1l1.6 3.2 1.6-3.2h2.1v9h-2v-4.3l-1.8 3.6h-.1l-1.8-3.6v4.3h-2v-9z"
      />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
