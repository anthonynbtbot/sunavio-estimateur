import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ImageOff, Loader2, LogOut, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatNumber } from "@/lib/formatNumber";
import { DataValue } from "@/components/ui/DataValue";
import { cn } from "@/lib/utils";
import { deleteLeadWithFiles } from "@/lib/deleteLead";

type LeadRow = {
  id: string;
  created_at: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  status: string;
  recommended_kwc: number | null;
  estimated_budget_min: number | null;
  estimated_budget_max: number | null;
  roof_ai_confidence: string | null;
  invoice_ai_confidence: string | null;
  roof_ai_analysis: any;
  roof_photos_urls: string[] | null;
};

const PAGE_SIZE = 20;

const roofAiBadge = (l: LeadRow) => {
  const ageMs = Date.now() - new Date(l.created_at).getTime();
  const young = ageMs < 2 * 60 * 1000;
  const r = l.roof_ai_analysis;
  if (!r) {
    if (young) return { label: "En attente", variant: "secondary" as const, title: "Analyse en cours" };
    return { label: "Non lancée", variant: "outline" as const, title: "Cliquer sur la fiche pour relancer" };
  }
  if (r.success === false) return { label: "Échouée", variant: "destructive" as const, title: r.reason ?? "" };
  return {
    label: `OK${l.roof_ai_confidence ? ` (${l.roof_ai_confidence})` : ""}`,
    variant: "default" as const,
    title: "",
  };
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tous statuts" },
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "study_sent", label: "Étude envoyée" },
  { value: "won", label: "Gagné" },
  { value: "lost", label: "Perdu" },
];

const STATUS_BADGES = [
  { value: "new", label: "Nouveaux" },
  { value: "contacted", label: "Contactés" },
  { value: "study_sent", label: "Étude envoyée" },
  { value: "won", label: "Gagnés" },
  { value: "lost", label: "Perdus" },
];

const statusLabel = (s: string) =>
  STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;

const statusVariant = (s: string): "default" | "secondary" | "outline" | "destructive" => {
  if (s === "won") return "default";
  if (s === "lost") return "destructive";
  if (s === "new") return "secondary";
  return "outline";
};

type SortColumn = "created_at" | "full_name" | "recommended_kwc" | "estimated_budget_min";
type SortDir = "asc" | "desc";

export const AdminLeadsList = () => {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState<SortColumn>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [allCities, setAllCities] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Leads — Sunavio Admin";
  }, []);

  // Reset to page 1 whenever filters/sort change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, cityFilter, sortCol, sortDir]);

  // Load status counts + cities once
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("leads").select("status, city").limit(2000);
      if (data) {
        const counts: Record<string, number> = {};
        const citySet = new Set<string>();
        data.forEach((r: any) => {
          counts[r.status] = (counts[r.status] ?? 0) + 1;
          if (r.city) citySet.add(r.city);
        });
        setStatusCounts(counts);
        setAllCities(Array.from(citySet).sort());
      }
    })();
  }, [leads.length]);

  // Load paginated leads
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      let q = supabase
        .from("leads")
        .select(
          "id, created_at, full_name, phone, email, city, status, recommended_kwc, estimated_budget_min, estimated_budget_max, roof_ai_confidence, invoice_ai_confidence, roof_ai_analysis, roof_photos_urls",
          { count: "exact" },
        )
        .order(sortCol, { ascending: sortDir === "asc", nullsFirst: false });

      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (cityFilter !== "all") q = q.eq("city", cityFilter);
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`full_name.ilike.${s},phone.ilike.${s},email.ilike.${s},city.ilike.${s}`);
      }

      const { data, count, error } = await q.range(start, end);
      if (error) {
        toast.error("Erreur de chargement des leads");
        console.error(error);
      } else {
        setLeads(data ?? []);
        setTotalCount(count ?? 0);
      }
      setLoading(false);
    };
    load();
  }, [page, sortCol, sortDir, statusFilter, cityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const grandTotal = useMemo(
    () => Object.values(statusCounts).reduce((a, b) => a + b, 0),
    [statusCounts],
  );
  const filtered = leads;
  const filteringActive =
    statusFilter !== "all" || cityFilter !== "all" || !!search.trim();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
  };

  const handleDelete = async (leadId: string) => {
    setDeletingId(leadId);
    const { error } = await deleteLeadWithFiles(leadId);
    setDeletingId(null);
    if (error) {
      toast.error("Échec de la suppression");
      console.error(error);
      return;
    }
    toast.success("Lead supprimé");
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    setTotalCount((c) => Math.max(0, c - 1));
  };

  const toggleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "full_name" ? "asc" : "desc");
    }
  };

  const SortHead = ({ col, children }: { col: SortColumn; children: React.ReactNode }) => (
    <TableHead>
      <button
        type="button"
        onClick={() => toggleSort(col)}
        className="inline-flex items-center gap-1 hover:text-primary transition-colors"
      >
        {children}
        {sortCol === col &&
          (sortDir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5 text-primary" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-primary" />
          ))}
      </button>
    </TableHead>
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Leads</h1>
            <p className="text-sm text-muted-foreground">
              {filteringActive
                ? `${totalCount} leads affichés sur ${grandTotal} au total`
                : `${grandTotal} leads au total`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        {/* Status badges (cliquables) */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3 py-1 text-xs rounded-full border transition-colors",
              statusFilter === "all"
                ? "bg-primary/15 border-primary text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            Tous · {grandTotal}
          </button>
          {STATUS_BADGES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatusFilter(s.value)}
              className={cn(
                "px-3 py-1 text-xs rounded-full border transition-colors",
                statusFilter === s.value
                  ? "bg-primary/15 border-primary text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s.label} · {statusCounts[s.value] ?? 0}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nom, téléphone, email, ville…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes villes</SelectItem>
              {allCities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortHead col="created_at">Date</SortHead>
                  <SortHead col="full_name">Nom</SortHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <SortHead col="recommended_kwc">kWc</SortHead>
                  <SortHead col="estimated_budget_min">Budget</SortHead>
                  <TableHead>IA toit</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-10">
                      Aucun lead
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer hover:bg-muted/40">
                    <TableCell className="whitespace-nowrap text-sm">
                      <Link to={`/admin/leads/${l.id}`} className="block">
                        {format(new Date(l.created_at), "d MMM HH:mm", { locale: fr })}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link to={`/admin/leads/${l.id}`} className="font-medium">
                        {l.full_name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>{l.city ?? "—"}</TableCell>
                    <TableCell className="text-sm">{l.phone ?? "—"}</TableCell>
                    <TableCell>
                      {l.recommended_kwc ? (
                        <DataValue value={formatNumber(l.recommended_kwc, 1)} unit="kWc" size="sm" tone="gold" />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.estimated_budget_min && l.estimated_budget_max ? (
                        <span className="inline-flex items-center gap-1">
                          <DataValue
                            value={formatNumber(Math.round(l.estimated_budget_min))}
                            unit="DH"
                            size="sm"
                            tone="gold"
                          />
                          <span className="text-muted-foreground">–</span>
                          <DataValue
                            value={formatNumber(Math.round(l.estimated_budget_max))}
                            unit="DH"
                            size="sm"
                            tone="gold"
                          />
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const hasPhotos = Array.isArray(l.roof_photos_urls) && l.roof_photos_urls.length > 0;
                        if (!hasPhotos) {
                          return (
                            <Badge
                              variant="outline"
                              title="Ce lead n'a pas fourni de photos de toit. La visite technique nécessitera une analyse complète sur place."
                              className="border-primary/50 text-primary bg-primary/5 inline-flex items-center gap-1"
                            >
                              <ImageOff className="h-3 w-3" />
                              Sans photo
                            </Badge>
                          );
                        }
                        const b = roofAiBadge(l);
                        return (
                          <Badge variant={b.variant} title={b.title} className="capitalize">
                            {b.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(l.status)}>
                        {statusLabel(l.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Supprimer le lead"
                          >
                            {deletingId === l.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce lead ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est définitive. Toutes les données du lead «&nbsp;{l.full_name ?? "Sans nom"}&nbsp;» seront supprimées et ne pourront pas être restaurées.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(l.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer définitivement
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              Page {page} sur {totalPages} · {totalCount} résultats
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Suivant <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
