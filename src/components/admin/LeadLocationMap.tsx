import { useCallback, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { OpenLocationCode } from "open-location-code";
import { Copy, ExternalLink, Loader2, Navigation } from "lucide-react";
import { toast } from "sonner";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { SUNAVIO_MAP_STYLE, GOLD_MARKER_SVG } from "@/lib/mapStyle";

const olc = new OpenLocationCode();
const MAP_LIBRARIES: ("places")[] = ["places"];

interface Props {
  lat: number | null;
  lng: number | null;
  address: string | null;
}

export const LeadLocationMap = ({ lat, lng, address }: Props) => {
  const { apiKey, loading: keyLoading } = useGoogleMapsKey();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? "",
    libraries: MAP_LIBRARIES,
    id: "google-map-script",
  });
  const [satellite, setSatellite] = useState(false);

  const copy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié`);
  }, []);

  if (lat == null || lng == null) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
        Géolocalisation non disponible pour ce lead. Adresse brute :{" "}
        <span className="text-foreground">{address ?? "—"}</span>
      </div>
    );
  }

  const plusCode = olc.encode(lat, lng);
  const coords = `${lat.toFixed(6)},${lng.toFixed(6)}`;

  if (keyLoading || !isLoaded) {
    return (
      <div className="h-[400px] bg-card border border-border flex items-center justify-center">
        <Loader2 className="size-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {address && (
        <p className="text-sm text-foreground font-medium">{address}</p>
      )}
      <div className="border border-border overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "400px" }}
          center={{ lat, lng }}
          zoom={16}
          options={{
            styles: satellite ? undefined : SUNAVIO_MAP_STYLE,
            mapTypeId: satellite ? "hybrid" : "roadmap",
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          <MarkerF
            position={{ lat, lng }}
            icon={{
              url: GOLD_MARKER_SVG,
              scaledSize: new google.maps.Size(36, 48),
              anchor: new google.maps.Point(18, 48),
            }}
          />
        </GoogleMap>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="space-y-0.5">
          <p>
            <span className="text-muted-foreground">Coordonnées :</span>{" "}
            <span className="font-mono text-foreground">{coords}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Plus Code :</span>{" "}
            <span className="font-mono text-foreground">{plusCode}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSatellite((s) => !s)}
          className="text-xs text-primary hover:underline"
        >
          {satellite ? "Vue plan" : "Vue satellite"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-border hover:border-primary/60 transition-colors"
        >
          <ExternalLink className="size-3.5" /> Google Maps
        </a>
        <a
          href={`https://www.waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-border hover:border-primary/60 transition-colors"
        >
          <Navigation className="size-3.5" /> Waze
        </a>
        <button
          type="button"
          onClick={() => copy(coords, "Coordonnées")}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-border hover:border-primary/60 transition-colors"
        >
          <Copy className="size-3.5" /> Copier coordonnées
        </button>
        <button
          type="button"
          onClick={() => copy(plusCode, "Plus Code")}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs border border-border hover:border-primary/60 transition-colors"
        >
          <Copy className="size-3.5" /> Copier Plus Code
        </button>
      </div>
    </div>
  );
};
