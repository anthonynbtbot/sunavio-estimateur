import { useRef, useState } from "react";
import { Camera, Info, X } from "lucide-react";
import { useEstimationStore } from "@/stores/estimationStore";
import { StepIntro } from "./EstimationLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PrivacyNotice } from "./PrivacyNotice";

const MAX_ROOF = 5;

export const Step4Photos = () => {
  const { photos, setPhotos } = useEstimationStore();
  const roofRef = useRef<HTMLInputElement>(null);
  const meterRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("lead-uploads")
      .upload(path, file);
    if (error) throw error;
    // Bucket is now private — return the relative path, not a public URL.
    return path;
  };

  const handleRoof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const remaining = MAX_ROOF - photos.roofUrls.length;
      const toUpload = files.slice(0, remaining);
      const paths = await Promise.all(toUpload.map((f) => uploadFile(f, "roofs")));
      setPhotos({
        roofFiles: [...photos.roofFiles, ...toUpload],
        roofUrls: [...photos.roofUrls, ...paths],
      });
    } catch (err) {
      toast.error("Échec de l'upload");
      console.error(err);
    } finally {
      setUploading(false);
      if (roofRef.current) roofRef.current.value = "";
    }
  };

  const removeRoof = (i: number) => {
    setPhotos({
      roofFiles: photos.roofFiles.filter((_, idx) => idx !== i),
      roofUrls: photos.roofUrls.filter((_, idx) => idx !== i),
    });
  };

  const handleMeter = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile(file, "meters");
      setPhotos({ meterFile: file, meterUrl: path });
    } catch (err) {
      toast.error("Échec de l'upload");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Local preview from File objects (bucket is private, no public URL).
  const roofPreview = (i: number): string => {
    const f = photos.roofFiles[i];
    return f ? URL.createObjectURL(f) : "";
  };

  return (
    <>
      <PrivacyNotice reason="Les photos servent uniquement à analyser votre toiture (orientation, surface, obstacles)." />
      <StepIntro
        title="Quelques photos pour affiner notre étude."
        subtitle="2 à 3 photos de votre toit prises avec votre téléphone nous suffisent. Elles nous aident à anticiper l'orientation, les obstacles et la meilleure disposition des panneaux."
      />

      <input
        ref={roofRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleRoof}
      />
      <input
        ref={meterRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleMeter}
      />

      <div className="mb-10">
        <h3 className="font-display text-lg text-foreground mb-1">
          Photos du toit
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Recommandé — 2 à 5 photos permettent une étude bien plus précise (détection d'obstacles, orientation, surface utilisable). Vous pouvez aussi passer cette étape si vous préférez.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {photos.roofUrls.length < MAX_ROOF && (
            <button
              type="button"
              onClick={() => roofRef.current?.click()}
              disabled={uploading}
              className="aspect-square border border-dashed border-primary/60 flex flex-col items-center justify-center gap-1 text-primary hover:bg-secondary transition-colors"
            >
              <Camera className="size-6" />
              <span className="text-xs">Ajouter</span>
            </button>
          )}
          {photos.roofUrls.map((_p, i) => (
            <div key={i} className="relative aspect-square group">
              <img
                src={roofPreview(i)}
                alt={`Toit ${i + 1}`}
                className="w-full h-full object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => removeRoof(i)}
                className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm border border-primary text-primary p-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Supprimer"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
        {photos.roofUrls.length === 0 && (
          <div className="mt-4 flex gap-2 items-start p-3 bg-card border border-primary/40 rounded-sm">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sans photos, notre ingénieur devra tout analyser lors de la visite technique — la pré-étude sera moins précise.
            </p>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Prenez vos photos directement ou sélectionnez-les depuis votre galerie, idéalement avec un bon éclairage et sous différents angles.
        </p>
      </div>

      <div>
        <h3 className="font-display text-lg text-foreground mb-1">
          Photo de votre compteur{" "}
          <span className="text-muted-foreground text-sm">(optionnel)</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Photo existante ou nouvelle prise de vue. Aide à vérifier la puissance souscrite.
        </p>
        <div className="w-32">
          {photos.meterUrl ? (
            <div className="relative aspect-square">
              <img
                src={photos.meterFile ? URL.createObjectURL(photos.meterFile) : ""}
                alt="Compteur"
                className="w-full h-full object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => setPhotos({ meterFile: null, meterUrl: null })}
                className="absolute top-1 right-1 bg-background/80 backdrop-blur-sm border border-primary text-primary p-1 hover:bg-primary hover:text-primary-foreground"
              >
                <X className="size-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => meterRef.current?.click()}
              disabled={uploading}
              className="aspect-square w-full border border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Camera className="size-6" />
              <span className="text-xs">Ajouter</span>
            </button>
          )}
        </div>
      </div>

      {uploading && (
        <p className="text-sm text-muted-foreground mt-4">Upload en cours…</p>
      )}
    </>
  );
};
