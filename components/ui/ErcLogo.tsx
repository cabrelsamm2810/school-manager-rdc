/**
 * Logo officiel des Églises du Réveil du Congo (E.R.C.)
 * — Livre ouvert avec bordure bleu foncé
 * — Lettres « E.R.C. » en rouge au centre
 * — Flamme au-dessus du livre (centre jaune, contour orange-rouge)
 */

type ErcLogoProps = {
  size?: number;
  className?: string;
};

export function ErcLogo({ size = 64, className = '' }: ErcLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Logo E.R.C. — Églises du Réveil du Congo"
    >
      {/* Flamme — contour orange-rouge */}
      <path
        d="M50 6 C 44 18, 38 24, 38 34 C 38 42, 43 48, 50 48 C 57 48, 62 42, 62 34 C 62 24, 56 18, 50 6 Z"
        fill="#FF4500"
      />
      {/* Flamme — centre jaune */}
      <path
        d="M50 14 C 47 22, 44 26, 44 33 C 44 39, 47 42, 50 42 C 53 42, 56 39, 56 33 C 56 26, 53 22, 50 14 Z"
        fill="#FFFF00"
      />

      {/* Livre ouvert — bordure bleu foncé */}
      <path
        d="M14 54 L 50 50 L 86 54 L 86 86 L 50 82 L 14 86 Z"
        fill="#00008B"
      />
      {/* Pages du livre — blanc */}
      <path
        d="M18 58 L 50 54 L 50 80 L 18 83 Z"
        fill="#FFFFFF"
      />
      <path
        d="M82 58 L 50 54 L 50 80 L 82 83 Z"
        fill="#FFFFFF"
      />
      {/* Ligne de reliure centrale */}
      <line x1="50" y1="54" x2="50" y2="80" stroke="#00008B" strokeWidth="1.5" />

      {/* Lettres E.R.C. en rouge */}
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fill="#FF0000"
        fontSize="11"
        fontWeight="bold"
        fontFamily="sans-serif"
        letterSpacing="0.5"
      >
        E.R.C.
      </text>
    </svg>
  );
}
