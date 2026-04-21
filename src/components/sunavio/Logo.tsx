import logoSrc from "@/assets/sunavio-logo.png";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "" }: LogoProps) => (
  <a
    href="https://sunavio.com"
    target="_self"
    aria-label="SUNAVIO — accueil"
    className={`inline-flex items-center transition-opacity hover:opacity-80 ${className}`}
  >
    <img
      src={logoSrc}
      alt="SUNAVIO"
      className="h-8 md:h-9 w-auto select-none"
      draggable={false}
    />
  </a>
);
