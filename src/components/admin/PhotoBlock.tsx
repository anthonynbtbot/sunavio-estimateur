import { Download, FileText, ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

type Props = {
  path: string;
  url: string | undefined;
  loading: boolean;
  label: string;
  allowDownload?: boolean;
};

const isPdf = (p: string) => /\.pdf($|\?)/i.test(p);

export const PhotoBlock = ({ path, url, loading, label, allowDownload }: Props) => {
  const pdf = isPdf(path);

  if (loading && !url) {
    return (
      <div className="space-y-2">
        <Skeleton className="w-full h-28 rounded-md" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-28 rounded-md border border-border bg-muted/30 text-muted-foreground gap-1">
        <ImageOff className="h-4 w-4" />
        <span className="text-xs">Non accessible</span>
        <span className="text-[10px] truncate max-w-full px-2">{label}</span>
      </div>
    );
  }

  if (pdf) {
    return (
      <div className="flex flex-col gap-2">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 p-3 rounded-md border border-border hover:bg-muted/40 transition-colors"
        >
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{label}</p>
            <p className="text-xs text-muted-foreground truncate">{path.split("/").pop()}</p>
          </div>
        </a>
        {allowDownload && (
          <Button asChild variant="outline" size="sm">
            <a href={url} download target="_blank" rel="noreferrer">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Télécharger le PDF
            </a>
          </Button>
        )}
      </div>
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block group">
      <img
        src={url}
        alt={label}
        loading="lazy"
        className="w-full h-28 object-cover rounded-md border border-border group-hover:opacity-90 transition-opacity"
      />
      <p className="text-xs text-muted-foreground mt-1 truncate">{label}</p>
    </a>
  );
};
