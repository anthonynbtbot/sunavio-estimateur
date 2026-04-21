import { Link } from "react-router-dom";
import logoSrc from "@/assets/sunavio-logo.png";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "" }: LogoProps) => (
  <Link
    to="/"
    aria-label="SUNAVIO — accueil"
    className={`inline-flex items-center transition-opacity hover:opacity-80 ${className}`}
  >
    <img
      src={logoSrc}
      alt="SUNAVIO"
      className="h-8 md:h-9 w-auto select-none"
      draggable={false}
    />
  </Link>
);
