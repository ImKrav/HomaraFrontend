import { By, PageElement, PageElements } from '@serenity-js/web';

/** Notificaciones emergentes (toasts). Tienen role="alert" (app/components/ui/Toast.tsx). */
export const Notificaciones = {
    todas: () => PageElements.located(By.css('[role="alert"] p')).describedAs('las notificaciones'),
    ultima: () => PageElement.located(By.css('[role="alert"]:last-of-type p')).describedAs('la última notificación'),
};
