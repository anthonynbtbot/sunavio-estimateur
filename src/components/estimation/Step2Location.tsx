import { MapPin } from "lucide-react";
import { useEstimationStore } from "@/stores/estimationStore";
import { StepIntro } from "./EstimationLayout";
import { AddressInput } from "./AddressInput";
import { PrivacyNotice } from "./PrivacyNotice";

const QUICK_CITIES = [
  { name: "Marrakech", lat: 31.6295, lng: -7.9811 },
  { name: "Casablanca", lat: 33.5731, lng: -7.5898 },
  { name: "Rabat", lat: 34.0209, lng: -6.8416 },
  { name: "Essaouira", lat: 31.5085, lng: -9.7595 },
  { name: "Agadir", lat: 30.4278, lng: -9.5981 },
  { name: "Tanger", lat: 35.7595, lng: -5.834 },
];

export const Step2Location = () => {
  const { location, setLocation } = useEstimationStore();

  const selectQuickCity = (c: typeof QUICK_CITIES[number]) => {
    setLocation({
      city: c.name,
      lat: c.lat,
      lng: c.lng,
      address: c.name,
    });
  };

  return (
    <>
      <PrivacyNotice reason="L'adresse précise sert uniquement à calculer l'ensoleillement local et l'orientation optimale des panneaux." />
      <StepIntro
        title="Où se situe votre projet ?"
        subtitle="L'ensoleillement varie beaucoup selon votre position. Saisissez votre adresse, un Plus Code Google ou faites glisser l'épingle pour ajuster."
      />

      <div className="space-y-6">
        <AddressInput
          value={{
            address: location.address,
            lat: location.lat,
            lng: location.lng,
            city: location.city,
          }}
          onChange={(d) => setLocation(d)}
        />

        <div>
          <p className="text-xs text-muted-foreground mb-2">Ou choisissez une grande ville :</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUICK_CITIES.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => selectQuickCity(c)}
                className={`px-3 py-2 text-xs border transition-all flex items-center justify-center gap-1.5 ${
                  location.city === c.name
                    ? "border-primary bg-secondary text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/60"
                }`}
              >
                <MapPin className="size-3" />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
