import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import { Loader2, MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { SUNAVIO_MAP_STYLE, GOLD_MARKER_SVG } from "@/lib/mapStyle";
import { estimateIrradiance } from "@/lib/irradiance";

const PLUS_CODE_GLOBAL = /^[23456789CFGHJMPQRVWX]{8}\+[23456789CFGHJMPQRVWX]{2,3}$/i;
const PLUS_CODE_LOCAL = /^[23456789CFGHJMPQRVWX]{4,6}\+[23456789CFGHJMPQRVWX]{2,3}\s+.+$/i;

const isPlusCode = (s: string) => {
  const t = s.trim();
  return PLUS_CODE_GLOBAL.test(t) || PLUS_CODE_LOCAL.test(t);
};

const MAP_LIBRARIES: ("places")[] = ["places"];
const MAP_CONTAINER_STYLE = { width: "100%", height: "280px" };

interface Prediction {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

interface Props {
  value: { address: string; lat: number | null; lng: number | null; city: string };
  onChange: (data: { address: string; city: string; lat: number; lng: number }) => void;
}

const genSessionToken = () =>
  typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const AddressInput = ({ value, onChange }: Props) => {
  const { apiKey, loading: keyLoading } = useGoogleMapsKey();
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? "",
    libraries: MAP_LIBRARIES,
    id: "google-map-script",
  });

  const [input, setInput] = useState(value.address);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);
  const [validatingPlusCode, setValidatingPlusCode] = useState(false);
  const sessionTokenRef = useRef<string>(genSessionToken());
  const debounceRef = useRef<number | null>(null);
  const skipNextFetchRef = useRef(false);

  const inputIsPlusCode = useMemo(() => isPlusCode(input), [input]);
  const hasPosition = value.lat !== null && value.lng !== null;
  const irradiance = hasPosition ? estimateIrradiance(value.lat!, value.lng!) : null;

  // Debounced autocomplete
  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (input.trim().length < 2 || inputIsPlusCode) {
      setPredictions([]);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase.functions.invoke("places-autocomplete", {
        body: { input, session_token: sessionTokenRef.current },
      });
      setSearching(false);
      if (data?.success) {
        setPredictions(data.predictions ?? []);
        setShowSuggestions(true);
      }
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [input, inputIsPlusCode]);

  const selectPrediction = useCallback(async (p: Prediction) => {
    skipNextFetchRef.current = true;
    setInput(p.description);
    setShowSuggestions(false);
    setPredictions([]);
    const { data } = await supabase.functions.invoke("geocode-address", {
      body: { place_id: p.place_id },
    });
    if (data?.success) {
      onChange({
        address: data.formatted_address,
        city: data.city ?? "",
        lat: data.lat,
        lng: data.lng,
      });
      sessionTokenRef.current = genSessionToken();
    }
  }, [onChange]);

  const validatePlusCode = useCallback(async () => {
    setValidatingPlusCode(true);
    const { data } = await supabase.functions.invoke("geocode-address", {
      body: { input },
    });
    setValidatingPlusCode(false);
    if (data?.success) {
      onChange({
        address: data.formatted_address,
        city: data.city ?? "",
        lat: data.lat,
        lng: data.lng,
      });
    }
  }, [input, onChange]);

  const onMarkerDragEnd = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const { data } = await supabase.functions.invoke("geocode-address", {
      body: { lat, lng },
    });
    if (data?.success) {
      skipNextFetchRef.current = true;
      setInput(data.formatted_address);
      onChange({
        address: data.formatted_address,
        city: data.city ?? value.city,
        lat,
        lng,
      });
    } else {
      onChange({ address: value.address, city: value.city, lat, lng });
    }
  }, [onChange, value.address, value.city]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-primary z-10" />
        <input
          type="text"
          placeholder="Saisissez votre adresse ou un Plus Code Google"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => predictions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          className="w-full bg-card border border-border pl-11 pr-10 py-3 text-foreground focus:border-primary focus:outline-none transition-colors"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground animate-spin" />
        )}

        {showSuggestions && predictions.length > 0 && (
          <ul className="absolute top-full left-0 right-0 mt-1 bg-card border border-border shadow-lg z-20 max-h-64 overflow-auto">
            {predictions.map((p) => (
              <li key={p.place_id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectPrediction(p)}
                  className="w-full text-left px-4 py-3 hover:bg-secondary border-b border-border/50 last:border-0 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{p.main_text}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.secondary_text}</p>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Vous avez un Plus Code Google (ex&nbsp;: <span className="font-mono">8C3JH4V9+CM</span>) ?
        Saisissez-le directement.
      </p>

      {inputIsPlusCode && (
        <button
          type="button"
          onClick={validatePlusCode}
          disabled={validatingPlusCode}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
        >
          {validatingPlusCode ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MapPin className="size-4" />
          )}
          Valider ce Plus Code
        </button>
      )}

      {hasPosition && (
        <div className="space-y-2">
          {keyLoading || !mapsLoaded ? (
            <div className="h-[280px] bg-card border border-border flex items-center justify-center">
              <Loader2 className="size-6 text-muted-foreground animate-spin" />
            </div>
          ) : (
            <div className="border border-border overflow-hidden">
              <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={{ lat: value.lat!, lng: value.lng! }}
                zoom={17}
                options={{
                  styles: SUNAVIO_MAP_STYLE,
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: false,
                  zoomControl: true,
                }}
              >
                <MarkerF
                  position={{ lat: value.lat!, lng: value.lng! }}
                  draggable
                  onDragEnd={onMarkerDragEnd}
                  icon={{
                    url: GOLD_MARKER_SVG,
                    scaledSize: new google.maps.Size(36, 48),
                    anchor: new google.maps.Point(18, 48),
                  }}
                />
              </GoogleMap>
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">
            Affiner la position en faisant glisser l'épingle
          </p>

          {irradiance && (
            <div className="bg-secondary border border-primary/40 px-4 py-3 flex items-start gap-3">
              <MapPin className="size-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Zone climatique détectée :{" "}
                <span className="text-primary font-medium">
                  {irradiance.name} = {irradiance.irradiance.toLocaleString("fr-FR")} kWh/kWc/an
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
