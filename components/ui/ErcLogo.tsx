/**
 * Logo officiel EC-ERC — même visuel que celui de la page d'inscription
 * (`/illustrations/ec-erc-logo.jpg`), présenté tel quel, sans cadre.
 */

type ErcLogoProps = {
  size?: number;
  className?: string;
};

export function ErcLogo({ size = 64, className = '' }: ErcLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/illustrations/ec-erc-logo.jpg"
      alt="Logo EC-ERC"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}
