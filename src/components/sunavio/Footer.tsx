import { Logo } from "./Logo";
import { Link } from "react-router-dom";
import { SUNAVIO_IDENTITY } from "@/lib/sunavioIdentity";

export const Footer = () => (
  <footer className="bg-background border-t border-transparent" id="contact">
    <div className="h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent opacity-60" />
    <div className="container py-16 grid gap-12 md:grid-cols-3">
      <div>
        <Logo />
        <p className="mt-5 text-sm text-muted-foreground leading-relaxed max-w-xs">
          Produire son énergie, reprendre le contrôle.
          <br />
          L'ingénierie solaire premium, à portée de tous.
        </p>
      </div>

      <div>
        <h4 className="font-display text-base text-foreground mb-4">Contact</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            {SUNAVIO_IDENTITY.contact.founderName}, {SUNAVIO_IDENTITY.contact.founderTitle}
          </li>
          <li>
            <a
              href={`tel:${SUNAVIO_IDENTITY.contact.phoneTel}`}
              className="hover:text-foreground transition-colors"
            >
              {SUNAVIO_IDENTITY.contact.phone}
            </a>
          </li>
          <li>
            <a
              href={`mailto:${SUNAVIO_IDENTITY.contact.email}`}
              className="hover:text-foreground transition-colors"
            >
              {SUNAVIO_IDENTITY.contact.email}
            </a>
          </li>
        </ul>
        <div className="mt-5 text-xs text-muted-foreground/80 leading-relaxed not-italic">
          <div className="font-medium text-foreground/80 mb-1">Siège social :</div>
          <address className="not-italic space-y-0.5">
            {SUNAVIO_IDENTITY.address.multiLine.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </address>
        </div>
      </div>

      <div>
        <h4 className="font-display text-base text-foreground mb-4">Informations</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors">
              Mentions légales
            </Link>
          </li>
          <li>
            <Link to="/politique-confidentialite" className="hover:text-foreground transition-colors">
              Politique de confidentialité
            </Link>
          </li>
          <li>
            <Link to="/conditions-generales" className="hover:text-foreground transition-colors">
              Conditions Générales
            </Link>
          </li>
          <li>
            <Link to="/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container py-6 text-xs text-muted-foreground/70 flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} SUNAVIO. Tous droits réservés.</span>
        <span>Marrakech · Casablanca · Essaouira</span>
      </div>
    </div>
  </footer>
);
