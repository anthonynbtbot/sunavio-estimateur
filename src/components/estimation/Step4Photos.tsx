import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import { useEstimationStore } from "@/stores/estimationStore";
import { StepIntro } from "./EstimationLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    return supabase.storage.from("lead-uploads").getPublicUrl(path).data.publicUrl;
  };

  const handleRoof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      const remaining = MAX_ROOF - photos.roofUrls.length;
      const toUpload = files.slice(0, remaining);
      const urls = await Promise.all(toUpload.map((f) => uploadFile(f, "roofs")));
      setPhotos({
        roofFiles: [...photos.roofFiles, ...toUpload],
        roofUrls: [...photos.roofUrls, ...urls],
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
      const url = await uploadFile(file, "meters");
      setPhotos({ meterFile: file, meterUrl: url });
    } catch (err) {
      toast.error("Échec de l'upload");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <StepIntro
        title="Quelques photos pour affiner notre étude."
        subtitle="2 à 3 photos de votre toit prises avec votre téléphone nous suffisent. Elles nous aident à anticiper l'orientation, les obstacles et la meilleure disposition des panneaux."
      />

      <input
        ref={roofRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleRoof}
      />
      <input
        ref={meterRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleMeter}
      />

      <div className="mb-10">
        <h3 className="font-display text-lg text-foreground mb-4">
          Photos du toit{" "}
          <span className="text-muted-foreground text-sm">(2 à 5)</span>
        </h3>
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
          {photos.roofUrls.map((url, i) => (
            <div key={i} className="relative aspect-square group">
              <img
                src={url}
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
        <p className="text-xs text-muted-foreground mt-3">
          Minimum 2 photos. Prenez-les si possible avec un bon éclairage, sous différents angles.
        </p>
      </div>

      <div>
        <h3 className="font-display text-lg text-foreground mb-1">
          Photo de votre compteur{" "}
          <span className="text-muted-foreground text-sm">(optionnel)</span>
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Aide à vérifier la puissance souscrite.
        </p>
        <div className="w-32">
          {photos.meterUrl ? (
            <div className="relative aspect-square">
              <img
                src={photos.meterUrl}
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
