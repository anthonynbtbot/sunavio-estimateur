import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Loader2, LogOut, Search } from "lucide-react";
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
};

const STATUS_OPTIONS = [
  { value: "all", label: "Tous statuts" },
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "study_sent", label: "Étude envoyée" },
  { value: "won", label: "Gagné" },
  { value: "lost", label: "Perdu" },
];

const statusLabel = (s: string) =>
  STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;

const statusVariant = (s: string): "default" | "secondary" | "outline" | "destructive" => {
  if (s === "won") return "default";
  if (s === "lost") return "destructive";
  if (s === "new") return "secondary";
  return "outline";
};

export const AdminLeadsList = () => {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  useEffect(() => {
    document.title = "Leads — Sunavio Admin";
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select(
          "id, created_at, full_name, phone, email, city, status, recommended_kwc, estimated_budget_min, estimated_budget_max, roof_ai_confidence, invoice_ai_confidence",
        )
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) {
        toast.error("Erreur de chargement des leads");
        console.error(error);
      } else {
        setLeads(data ?? []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const cities = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => l.city && set.add(l.city));
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (cityFilter !== "all" && l.city !== cityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = [l.full_name, l.phone, l.email, l.city]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, statusFilter, cityFilter]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Déconnecté");
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Leads</h1>
            <p className="text-sm text-muted-foreground">
              {leads.length} au total · {filtered.length} affichés
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-6 py-6 space-y-4">
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
              {cities.map((c) => (
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
                  <TableHead>Date</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>kWc</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>IA toit</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-10">
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
                      {l.recommended_kwc ? `${l.recommended_kwc} kWc` : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {l.estimated_budget_min && l.estimated_budget_max
                        ? `${(l.estimated_budget_min / 1000).toFixed(0)}–${(l.estimated_budget_max / 1000).toFixed(0)}k MAD`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {l.roof_ai_confidence ? (
                        <Badge variant="outline" className="capitalize">
                          {l.roof_ai_confidence}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(l.status)}>
                        {statusLabel(l.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </main>
  );
};
