import { Link } from "react-router-dom";
import { Logo } from "@/components/sunavio/Logo";
import { SUNAVIO_IDENTITY } from "@/lib/sunavioIdentity";

export const EstimationFooter = () => (
  <footer className="border-t border-border bg-background mt-16">
    <div className="container py-10 grid gap-8 md:grid-cols-3 text-sm">
      <div className="space-y-3">
        <Logo />
        <p className="text-foreground/90 font-medium">
          SUNAVIO SARL — Société marocaine immatriculée
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          RC : {SUNAVIO_IDENTITY.rc.replace(" Marrakech", "")} Marrakech | ICE :{" "}
          {SUNAVIO_IDENTITY.ice} | IF : {SUNAVIO_IDENTITY.if}
        </p>
      </div>

      <div className="space-y-2 text-muted-foreground">
        <h4 className="font-display text-foreground mb-2">Contact</h4>
        <address className="not-italic text-xs leading-relaxed">
          {SUNAVIO_IDENTITY.address.multiLine.map((line) => (
            <div key={line}>{line}</div>
          ))}
        </address>
        <div className="text-xs space-y-1 pt-1">
          <div>
            Tél :{" "}
            <a
              href={`tel:${SUNAVIO_IDENTITY.contact.phoneTel}`}
              className="hover:text-foreground transition-colors"
            >
              +212 6 63 28 44 24
            </a>
          </div>
          <div>
            Email :{" "}
            <a
              href={`mailto:${SUNAVIO_IDENTITY.contact.email}`}
              className="hover:text-foreground transition-colors"
            >
              {SUNAVIO_IDENTITY.contact.email}
            </a>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-display text-foreground mb-2">Informations légales</h4>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>
            <Link to="/mentions-legales" className="hover:text-foreground transition-colors">
              Mentions légales
            </Link>
          </li>
          <li>
            <Link
              to="/politique-confidentialite"
              className="hover:text-foreground transition-colors"
            >
              Politique de confidentialité
            </Link>
          </li>
          <li>
            <Link to="/me/delete" className="hover:text-foreground transition-colors">
              Supprimer mes données
            </Link>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container py-4 text-xs text-muted-foreground/70 text-center">
        © {new Date().getFullYear()} SUNAVIO SARL. Données chiffrées (HTTPS) · Hébergement
        sécurisé · CNDP loi 09-08.
      </div>
    </div>
  </footer>
);