import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
}

export const Logo = ({ className = "" }: LogoProps) => (
  <Link
    to="/"
    aria-label="SUNAVIO — accueil"
    className={`font-display text-2xl tracking-[0.25em] text-primary hover:text-primary-hover transition-colors ${className}`}
  >
    SUNAVIO
  </Link>
);
