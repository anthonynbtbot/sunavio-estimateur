import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie_consent_acknowledged";

export const CookieBanner = () => {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Hide on admin routes and self-service pages
  const hidden =
    location.pathname.startsWith("/admin") || location.pathname.startsWith("/me/");

  useEffect(() => {
    if (hidden) return;
    try {
      const ack = localStorage.getItem(STORAGE_KEY);
      if (!ack) setVisible(true);
    } catch {
      // localStorage unavailable — don't block the user
    }
  }, [hidden]);

  if (hidden || !visible) return null;

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ acknowledged: true, date: new Date().toISOString() }),
      );
    } catch {
      // ignore
    }
    setClosing(true);
    setTimeout(() => setVisible(false), 300);
  };

  return (
    <div
      role="region"
      aria-label="Information sur les cookies"
      className={`fixed inset-x-0 bottom-0 z-[100] bg-card border-t border-primary/40 shadow-elegant transition-opacity duration-300 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="container py-4 md:py-3 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          Ce site utilise uniquement des cookies strictement nécessaires à son
          fonctionnement. En poursuivant votre navigation, vous acceptez leur
          utilisation.{" "}
          <Link
            to="/cookies"
            className="text-primary underline hover:text-primary-hover whitespace-nowrap"
          >
            En savoir plus
          </Link>
        </p>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAcknowledge}
          className="shrink-0 w-full md:w-auto"
        >
          J'ai compris
        </Button>
      </div>
    </div>
  );
};
