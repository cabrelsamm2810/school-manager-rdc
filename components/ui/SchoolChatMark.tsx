import { clsx } from 'clsx';

/**
 * Symbole « Toque et Fréquence » de SchoolChat (toque + ondes), issu de la
 * bibliothèque d'assets de l'application.
 *
 * Seule source de l'URL : en-tête du fil de conversations, barre latérale
 * (ordinateur) et drawer mobile. Ne pas le redessiner en SVG ni le recolorer.
 */
const SCHOOLCHAT_MARK_SRC =
  'https://media.base44.com/images/public/6ac23ac4d49d203bbea35885/304f59fea_generated_1ba02996.png';

export function SchoolChatMark({ className }: { className?: string }) {
  return <img src={SCHOOLCHAT_MARK_SRC} alt="" className={clsx('shrink-0 object-contain', className)} />;
}
