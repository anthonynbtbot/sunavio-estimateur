import { ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Logo } from "@/components/sunavio/Logo";
import { Button } from "@/components/ui/button";
import { STEP_NAMES, useEstimationStore } from "@/stores/estimationStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EstimationFooter } from "./EstimationFooter";

interface EstimationLayoutProps {
  children: ReactNode;
  canContinue: boolean;
  onContinue: () => void;
  continueLabel?: string;
  hideNav?: boolean;
}

export const EstimationLayout = ({
  children,
  canContinue,
  onContinue,
  continueLabel = "Continuer",
  hideNav = false,
}: EstimationLayoutProps) => {
  const navigate = useNavigate();
  const { currentStep, prev, consumption, location, housing } = useEstimationStore();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasData =
    consumption.method !== null ||
    location.address.length > 0 ||
    housing.type !== null;

  const handleQuit = () => {
    if (hasData) setConfirmOpen(true);
    else navigate("/");
  };

  const stepName = STEP_NAMES[currentStep - 1];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Logo className="text-xl" />
          <button
            onClick={handleQuit}
            className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 transition-colors"
            aria-label="Quitter"
          >
            <X className="size-4" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
        {/* Progress */}
        <div className="container pb-3">
          <div className="flex gap-1.5">
            {STEP_NAMES.map((_, i) => {
              const idx = i + 1;
              const active = idx === currentStep;
              const done = idx < currentStep;
              return (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    done || active ? "bg-primary" : "bg-border"
                  } ${active ? "shadow-gold" : ""}`}
                />
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2 tracking-wide">
            Étape {currentStep} sur 5 — {stepName}
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        <div className="container max-w-2xl py-10 md:py-16 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom nav */}
      {!hideNav && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background via-background to-background/0 pt-8 pb-4">
          <div className="container max-w-2xl flex items-center justify-between gap-4">
            <Button
              variant="goldOutline"
              onClick={prev}
              disabled={currentStep === 1}
              size="lg"
            >
              <ChevronLeft className="size-4" />
              Précédent
            </Button>
            <Button
              variant="primary"
              onClick={onContinue}
              disabled={!canContinue}
              size="lg"
              className="min-w-[180px]"
            >
              {continueLabel}
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quitter l'estimation ?</DialogTitle>
            <DialogDescription>
              Vos réponses ne seront pas conservées. Vous devrez recommencer depuis le début.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="goldOutline" onClick={() => setConfirmOpen(false)}>
              Continuer mon étude
            </Button>
            <Button variant="primary" onClick={() => navigate("/")}>
              Quitter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EstimationFooter />
    </div>
  );
};

export const StepIntro = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="mb-10">
    <h1 className="font-display text-3xl md:text-4xl text-foreground leading-tight">
      {title}
    </h1>
    <span className="gold-rule mt-4 mb-5" />
    <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-xl">
      {subtitle}
    </p>
  </div>
);
