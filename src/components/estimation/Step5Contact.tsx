import { useState } from "react";
import { Link } from "react-router-dom";
import { useEstimationStore } from "@/stores/estimationStore";
import { StepIntro } from "./EstimationLayout";
import { useErrorHighlight } from "@/hooks/useErrorHighlight";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrivacyNotice } from "./PrivacyNotice";
import { ShieldCheck } from "lucide-react";

interface Step5Props {
  acceptTerms: boolean;
  setAcceptTerms: (v: boolean) => void;
  acceptContact: boolean;
  setAcceptContact: (v: boolean) => void;
}

export const Step5Contact = ({
  acceptTerms,
  setAcceptTerms,
  acceptContact,
  setAcceptContact,
}: Step5Props) => {
  const { contact, setContact } = useEstimationStore();
  const [rgpdOpen, setRgpdOpen] = useState(false);
  const nameHl = useErrorHighlight("contact-fullname");
  const phoneHl = useErrorHighlight("contact-phone");
  const emailHl = useErrorHighlight("contact-email");

  return (
    <>
      <PrivacyNotice reason="Vos coordonnées nous permettent de vous transmettre l'étude générée et de planifier la visite technique gratuite." />
      <StepIntro
        title="Dernière étape : où vous envoyer votre étude."
        subtitle="Votre étude détaillée vous sera envoyée par WhatsApp et email. Un ingénieur SUNAVIO vous contactera ensuite pour une visite technique gratuite, sans engagement."
      />

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Nom complet
          </label>
          <input
            id="contact-fullname"
            type="text"
            value={contact.fullName}
            onChange={(e) => setContact({ fullName: e.target.value })}
            maxLength={100}
            onFocus={nameHl.onFocus}
            data-error={nameHl["data-error"]}
            className={cn(
              "w-full bg-card border border-border px-4 py-3 text-foreground focus:border-primary focus:outline-none",
              nameHl.className,
            )}
          />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Numéro WhatsApp
          </label>
          <div className="flex">
            <span className="bg-card border border-r-0 border-border px-3 py-3 text-muted-foreground">
              +212
            </span>
            <input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              placeholder="6 12 34 56 78"
              value={contact.phone}
              onChange={(e) => setContact({ phone: e.target.value })}
              maxLength={20}
              onFocus={phoneHl.onFocus}
              data-error={phoneHl["data-error"]}
              className={cn(
                "flex-1 bg-card border border-border px-4 py-3 text-foreground focus:border-primary focus:outline-none",
                phoneHl.className,
              )}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Email <span className="italic">— facultatif</span>
          </label>
          <input
            id="contact-email"
            type="email"
            value={contact.email}
            onChange={(e) => setContact({ email: e.target.value })}
            maxLength={255}
            onFocus={emailHl.onFocus}
            data-error={emailHl["data-error"]}
            className={cn(
              "w-full bg-card border border-border px-4 py-3 text-foreground focus:border-primary focus:outline-none",
              emailHl.className,
            )}
          />
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1 size-4 accent-primary shrink-0"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              J'ai lu et j'accepte les{" "}
              <Link
                to="/conditions-generales"
                target="_blank"
                className="text-primary underline hover:text-primary-hover"
              >
                Conditions Générales d'Utilisation
              </Link>{" "}
              et la{" "}
              <Link
                to="/politique-confidentialite"
                target="_blank"
                className="text-primary underline hover:text-primary-hover"
              >
                Politique de confidentialité
              </Link>{" "}
              de SUNAVIO.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptContact}
              onChange={(e) => setAcceptContact(e.target.checked)}
              className="mt-1 size-4 accent-primary shrink-0"
            />
            <span className="text-sm text-muted-foreground leading-relaxed">
              J'accepte d'être contacté par SUNAVIO SARL par téléphone, WhatsApp ou
              email concernant mon projet d'installation solaire.
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={() => setRgpdOpen(true)}
          className="text-xs text-muted-foreground underline hover:text-primary transition-colors"
        >
          En savoir plus sur l'utilisation de vos données
        </button>

        <div className="mt-2 rounded-md border border-primary/30 bg-card/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="size-4 text-primary" aria-hidden />
            <h4 className="font-display text-sm text-foreground">
              Ce que nous faisons avec vos données
            </h4>
          </div>
          <ul className="text-xs text-muted-foreground leading-relaxed space-y-1.5 list-disc list-inside">
            <li>Génération de votre pré-étude solaire personnalisée.</li>
            <li>Contact commercial uniquement avec votre accord explicite.</li>
            <li>Stockage sécurisé en base chiffrée (HTTPS, tunnel Cloudflare).</li>
            <li>Conservation 3 ans maximum.</li>
            <li>
              Droit d'accès, rectification et suppression à tout moment via{" "}
              <Link
                to="/me/delete"
                target="_blank"
                className="text-primary underline hover:text-primary-hover"
              >
                /me/delete
              </Link>
              .
            </li>
          </ul>
        </div>
      </div>

      <Dialog open={rgpdOpen} onOpenChange={setRgpdOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Vos données, votre contrôle</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Vos données sont stockées de manière sécurisée sur des serveurs européens
            (Supabase, Union Européenne). Elles sont utilisées uniquement pour générer
            votre étude solaire et vous recontacter dans le cadre de ce projet. Vous
            pouvez demander leur suppression à tout moment en contactant{" "}
            <span className="text-primary">sunavio.contact@gmail.com</span>. SUNAVIO ne
            partage jamais vos données avec des tiers à des fins commerciales.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
