import { useState } from "react";
import { useEstimationStore } from "@/stores/estimationStore";
import { StepIntro } from "./EstimationLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Step5Props {
  acceptTerms: boolean;
  setAcceptTerms: (v: boolean) => void;
}

export const Step5Contact = ({ acceptTerms, setAcceptTerms }: Step5Props) => {
  const { contact, setContact } = useEstimationStore();
  const [rgpdOpen, setRgpdOpen] = useState(false);

  return (
    <>
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
            type="text"
            value={contact.fullName}
            onChange={(e) => setContact({ fullName: e.target.value })}
            maxLength={100}
            className="w-full bg-card border border-border px-4 py-3 text-foreground focus:border-primary focus:outline-none"
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
              type="tel"
              inputMode="tel"
              placeholder="6 12 34 56 78"
              value={contact.phone}
              onChange={(e) => setContact({ phone: e.target.value })}
              maxLength={20}
              className="flex-1 bg-card border border-border px-4 py-3 text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Email <span className="italic">— facultatif</span>
          </label>
          <input
            type="email"
            value={contact.email}
            onChange={(e) => setContact({ email: e.target.value })}
            maxLength={255}
            className="w-full bg-card border border-border px-4 py-3 text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <label className="flex items-start gap-3 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1 size-4 accent-primary shrink-0"
          />
          <span className="text-sm text-muted-foreground leading-relaxed">
            J'accepte que SUNAVIO utilise ces informations pour me transmettre mon étude solaire et me recontacter.
          </span>
        </label>

        <button
          type="button"
          onClick={() => setRgpdOpen(true)}
          className="text-xs text-muted-foreground underline hover:text-primary transition-colors"
        >
          En savoir plus sur l'utilisation de vos données
        </button>
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
