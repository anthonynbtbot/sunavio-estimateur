import { MapPin } from "lucide-react";
import { useEstimationStore } from "@/stores/estimationStore";
import { StepIntro } from "./EstimationLayout";

const MOROCCAN_CITIES = [
  { name: "Marrakech", lat: 31.6295, lng: -7.9811, irradiance: 1650 },
  { name: "Casablanca", lat: 33.5731, lng: -7.5898, irradiance: 1600 },
  { name: "Rabat", lat: 34.0209, lng: -6.8416, irradiance: 1600 },
  { name: "Essaouira", lat: 31.5085, lng: -9.7595, irradiance: 1750 },
  { name: "Agadir", lat: 30.4278, lng: -9.5981, irradiance: 1700 },
  { name: "Tanger", lat: 35.7595, lng: -5.834, irradiance: 1550 },
  { name: "Fès", lat: 34.0181, lng: -5.0078, irradiance: 1620 },
  { name: "Meknès", lat: 33.8935, lng: -5.5473, irradiance: 1620 },
  { name: "Oujda", lat: 34.6814, lng: -1.9086, irradiance: 1680 },
  { name: "Autre", lat: 31.7917, lng: -7.0926, irradiance: 1600 },
];

export const Step2Location = () => {
  const { location, setLocation } = useEstimationStore();

  const selectCity = (cityName: string) => {
    const city = MOROCCAN_CITIES.find((c) => c.name === cityName);
    if (!city) return;
    setLocation({
      city: city.name,
      lat: city.lat,
      lng: city.lng,
    });
  };

  const selectedCity = MOROCCAN_CITIES.find((c) => c.name === location.city);

  return (
    <>
      <StepIntro
        title="Où se situe votre projet ?"
        subtitle="L'ensoleillement varie beaucoup entre Marrakech, Essaouira ou Casablanca. Votre adresse précise nous permet d'estimer la production solaire au plus juste."
      />

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Adresse
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary" />
            <input
              type="text"
              placeholder="Quartier, rue, point de repère…"
              value={location.address}
              onChange={(e) => setLocation({ address: e.target.value })}
              className="w-full bg-card border border-border pl-11 pr-4 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Ville
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {MOROCCAN_CITIES.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => selectCity(c.name)}
                className={`px-4 py-3 text-sm border transition-all ${
                  location.city === c.name
                    ? "border-primary bg-secondary text-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/60"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {selectedCity && (
          <div className="bg-secondary border border-primary/40 px-4 py-3 flex items-start gap-3">
            <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              Zone climatique détectée :{" "}
              <span className="text-primary font-medium">
                {selectedCity.name} = {selectedCity.irradiance.toLocaleString("fr-FR")} kWh/kWc/an
              </span>
            </p>
          </div>
        )}
      </div>
    </>
  );
};
