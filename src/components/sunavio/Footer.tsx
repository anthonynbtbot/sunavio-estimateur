import { Logo } from "./Logo";

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
            <a href="tel:+212663284400" className="hover:text-foreground transition-colors">
              +212 06 63 28 44
            </a>
          </li>
          <li>
            <a
              href="mailto:sunavio.contact@gmail.com"
              className="hover:text-foreground transition-colors"
            >
              sunavio.contact@gmail.com
            </a>
          </li>
          <li>Marrakech, Maroc</li>
        </ul>
      </div>

      <div>
        <h4 className="font-display text-base text-foreground mb-4">Informations</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>
            <a href="#" className="hover:text-foreground transition-colors">
              Mentions légales
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-foreground transition-colors">
              Politique de confidentialité
            </a>
          </li>
          <li>
            <a href="#" className="hover:text-foreground transition-colors">
              CGU
            </a>
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
