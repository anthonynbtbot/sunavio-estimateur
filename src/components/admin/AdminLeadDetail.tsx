import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, Save, Trash2 } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useSignedUrls } from "@/hooks/useSignedUrls";
import { PhotoBlock } from "./PhotoBlock";
import { LeadLocationMap } from "./LeadLocationMap";
import { formatKwc, formatKwh, formatDh, formatYears, formatNumber } from "@/lib/formatNumber";
import { DataValue } from "@/components/ui/DataValue";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_OPTIONS = [
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "study_sent", label: "Étude envoyée" },
  { value: "won", label: "Gagné" },
  { value: "lost", label: "Perdu" },
];

type Lead = {
  id: string;
  created_at: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  consumption_kwh_year: number | null;
  housing_type: string | null;
  roof_type: string | null;
  has_ac: boolean | null;
  has_pool: boolean | null;
  has_ev: boolean | null;
  recommended_kwc: number | null;
  estimated_production_kwh: number | null;
  estimated_budget_min: number | null;
  estimated_budget_max: number | null;
  estimated_roi_years: number | null;
  invoice_photo_url: string | null;
  invoice_ai_extracted: any;
  invoice_ai_confidence: string | null;
  roof_photos_urls: string[] | null;
  roof_ai_analysis: any;
  roof_ai_confidence: string | null;
  status: string;
  notes: string | null;
  v2_battery_capacity_kwh: number | null;
  v2_battery_modules: number | null;
  v2_budget_min: number | null;
  v2_budget_max: number | null;
  v2_roi_years: number | null;
  personalized_message: string | null;
  dimensioning_ai_result: any;
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-right">{value ?? "—"}</span>
  </div>
);

export const AdminLeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("new");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const allPaths = useMemo(
    () =>
      [lead?.invoice_photo_url, ...(lead?.roof_photos_urls ?? [])].filter(
        (p): p is string => !!p,
      ),
    [lead?.invoice_photo_url, lead?.roof_photos_urls],
  );
  const { urls, loading: urlsLoading } = useSignedUrls(allPaths);
  const getUrl = (p?: string | null) => (p ? urls[p] : undefined);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        toast.error("Lead introuvable");
      } else {
        setLead(data as Lead);
        setStatus(data.status);
        setNotes(data.notes ?? "");
        document.title = `${data.full_name ?? "Lead"} — Sunavio Admin`;
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!id || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from("leads")
      .update({ status, notes: notes || null })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast.error("Échec de la mise à jour");
      console.error(error);
    } else {
      toast.success("Lead mis à jour");
      setLead((prev) => (prev ? { ...prev, status, notes } : prev));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Lead introuvable.</p>
      </div>
    );
  }

  const roof = lead.roof_ai_analysis;
  const invoice = lead.invoice_ai_extracted;
  const dirty = status !== lead.status || (notes || "") !== (lead.notes ?? "");

  const ageMs = Date.now() - new Date(lead.created_at).getTime();
  const olderThan2min = ageMs > 2 * 60 * 1000;
  const hasEnoughPhotos = (lead.roof_photos_urls?.length ?? 0) >= 2;
  const analysisFailedOrMissing = !roof || roof?.success === false;
  const canRelaunch = analysisFailedOrMissing && olderThan2min && hasEnoughPhotos;

  const handleRelaunchRoof = async () => {
    if (!lead || reanalyzing) return;
    setReanalyzing(true);
    const { data, error } = await supabase.functions.invoke("analyze-roof", {
      body: { leadId: lead.id, photoPaths: lead.roof_photos_urls },
    });
    setReanalyzing(false);
    if (error) {
      toast.error(error.message ?? "Échec de la relance");
      return;
    }
    if (data?.success === false) {
      toast.error(`Analyse échouée : ${data.reason ?? "raison inconnue"}`);
      return;
    }
    toast.success("Analyse relancée avec succès");
    const { data: refreshed } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead.id)
      .maybeSingle();
    if (refreshed) setLead(refreshed as Lead);
  };


  return (
    <main className="min-h-screen bg-background pb-12">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour
          </Link>
          <span className="text-xs text-muted-foreground">
            Créé le {format(new Date(lead.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">{lead.full_name ?? "Sans nom"}</h1>
            <p className="text-muted-foreground">
              {lead.phone} {lead.email && `· ${lead.email}`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {[lead.address, lead.city].filter(Boolean).join(", ") || "Adresse non renseignée"}
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {STATUS_OPTIONS.find((s) => s.value === lead.status)?.label ?? lead.status}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estimation calculée</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <Field
                label="Puissance recommandée"
                value={lead.recommended_kwc ? <DataValue value={formatNumber(lead.recommended_kwc, 1)} unit="kWc" size="sm" tone="gold" /> : null}
              />
              <Field
                label="Production estimée"
                value={lead.estimated_production_kwh ? <><DataValue value={formatNumber(Math.round(lead.estimated_production_kwh))} unit="kWh" size="sm" tone="gold" /><span className="text-muted-foreground">/an</span></> : null}
              />
              <Field
                label="Budget"
                value={
                  lead.estimated_budget_min && lead.estimated_budget_max ? (
                    <span className="inline-flex items-center gap-1">
                      <DataValue value={formatNumber(Math.round(lead.estimated_budget_min))} unit="DH" size="sm" tone="gold" />
                      <span className="text-muted-foreground">–</span>
                      <DataValue value={formatNumber(Math.round(lead.estimated_budget_max))} unit="DH" size="sm" tone="gold" />
                    </span>
                  ) : null
                }
              />
              <Field
                label="ROI"
                value={lead.estimated_roi_years ? <DataValue value={formatNumber(lead.estimated_roi_years, 1)} unit="ans" size="sm" tone="gold" /> : null}
              />
              <Field
                label="Conso annuelle"
                value={lead.consumption_kwh_year ? <DataValue value={formatNumber(Math.round(lead.consumption_kwh_year))} unit="kWh" size="sm" tone="gold" /> : null}
              />
              {roof?.sizing_adjustment?.applied && (
                <div className="mt-3 p-3 rounded-md border border-border bg-muted/40 text-xs space-y-1">
                  <p className="font-medium text-foreground">
                    ⚡ Puissance plafonnée par la surface IA
                  </p>
                  <p className="text-muted-foreground">
                    Initial : {roof.sizing_adjustment.previous_kwc} kWc · Plafonné à {roof.sizing_adjustment.capped_kwc} kWc
                    <br />
                    Surface utile retenue : {roof.sizing_adjustment.surface_m2_used} m² ({roof.sizing_adjustment.m2_per_kwc} m²/kWc)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Habitation</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <Field label="Type" value={lead.housing_type} />
              <Field label="Toiture" value={lead.roof_type} />
              <Field label="Climatisation" value={lead.has_ac ? "Oui" : "Non"} />
              <Field label="Piscine" value={lead.has_pool ? "Oui" : "Non"} />
              <Field label="Voiture électrique" value={lead.has_ev ? "Oui" : "Non"} />
            </CardContent>
          </Card>
        </div>

        {/* Premium V2 (batterie) */}
        {lead.v2_battery_capacity_kwh && lead.v2_battery_modules && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version Premium (V2 — avec batterie)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <Field
                label="Capacité batterie"
                value={<DataValue value={formatNumber(lead.v2_battery_capacity_kwh, 1)} unit="kWh" size="sm" tone="gold" />}
              />
              <Field
                label="Modules WeCo 5K3 EVO"
                value={<DataValue value={lead.v2_battery_modules} unit="modules" size="sm" tone="gold" />}
              />
              <Field
                label="Budget V2"
                value={
                  lead.v2_budget_min && lead.v2_budget_max ? (
                    <span className="inline-flex items-center gap-1">
                      <DataValue value={formatNumber(Math.round(lead.v2_budget_min))} unit="DH" size="sm" tone="gold" />
                      <span className="text-muted-foreground">–</span>
                      <DataValue value={formatNumber(Math.round(lead.v2_budget_max))} unit="DH" size="sm" tone="gold" />
                    </span>
                  ) : null
                }
              />
              <Field
                label="ROI V2"
                value={lead.v2_roi_years ? <DataValue value={formatNumber(lead.v2_roi_years, 1)} unit="ans" size="sm" tone="gold" /> : null}
              />
            </CardContent>
          </Card>
        )}

        {/* Message personnalisé envoyé au prospect */}
        {lead.personalized_message && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Message envoyé au prospect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-5">
                <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-primary rounded-full" />
                <p className="font-display italic text-base leading-relaxed text-foreground">
                  {lead.personalized_message}
                </p>
                <p className="text-xs text-muted-foreground mt-3 text-right">
                  Anthony NEBOUT · Co-fondateur SUNAVIO
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Localisation</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadLocationMap lat={lead.lat} lng={lead.lng} address={lead.address} />
          </CardContent>
        </Card>

        {/* Analyse IA Facture */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Analyse IA — Facture</CardTitle>
            {lead.invoice_ai_confidence && (
              <Badge variant="outline" className="capitalize">{lead.invoice_ai_confidence}</Badge>
            )}
          </CardHeader>
          <CardContent>
            {invoice ? (
              <div className="space-y-1">
                {invoice.contract_type && <Field label="Contrat" value={invoice.contract_type} />}
                {invoice.subscribed_power_kva && (
                  <Field label="Puissance souscrite" value={`${invoice.subscribed_power_kva} kVA`} />
                )}
                {Array.isArray(invoice.monthly_kwh) && (
                  <Field label="Conso mensuelles (kWh)" value={invoice.monthly_kwh.join(" · ")} />
                )}
                {invoice.annual_kwh && <Field label="Conso annuelle" value={formatKwh(invoice.annual_kwh)} />}
                {invoice.notes && <Field label="Notes" value={invoice.notes} />}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune analyse disponible.</p>
            )}
            {lead.invoice_photo_url && (
              <div className="mt-4 max-w-sm">
                <PhotoBlock
                  path={lead.invoice_photo_url}
                  url={getUrl(lead.invoice_photo_url)}
                  loading={urlsLoading}
                  label="Facture ONEE"
                  allowDownload
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analyse IA Toit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Analyse IA — Toiture</CardTitle>
            {lead.roof_ai_confidence && (
              <Badge variant="outline" className="capitalize">{lead.roof_ai_confidence}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {roof?.success === false && (
              <p className="text-sm text-destructive">
                Analyse échouée : {roof.reason ?? "raison inconnue"}.
              </p>
            )}
            {roof?.roof && (
              <div>
                <Field label="Type" value={roof.roof.type} />
                <Field label="Matériau" value={roof.roof.material} />
                <Field label="État" value={roof.roof.condition} />
                {roof.roof.condition_notes && (
                  <Field label="Notes état" value={roof.roof.condition_notes} />
                )}
              </div>
            )}
            {roof?.geometry && (
              <div>
                <Field label="Surface utile" value={roof.geometry.usable_surface_m2 ? `${roof.geometry.usable_surface_m2} m²` : null} />
                <Field label="Orientation" value={roof.geometry.orientation} />
                <Field label="Pente" value={roof.geometry.tilt_degrees != null ? `${roof.geometry.tilt_degrees}°` : null} />
              </div>
            )}
            {Array.isArray(roof?.obstacles) && roof.obstacles.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Obstacles</p>
                <ul className="space-y-1">
                  {roof.obstacles.map((o: any, i: number) => (
                    <li key={i} className="text-sm">
                      <span className="font-medium capitalize">{o.type}</span> — {o.label}
                      {o.impact_pct != null && <span className="text-muted-foreground"> · -{o.impact_pct}%</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {roof?.shading && (
              <div>
                <Field label="Risque ombrage" value={roof.shading.risk} />
                {roof.shading.notes && <Field label="Notes ombrage" value={roof.shading.notes} />}
              </div>
            )}
            {roof?.recommendation && (
              <div>
                <Field label="Verdict" value={roof.recommendation.verdict} />
                {roof.recommendation.rationale && (
                  <Field label="Justification" value={roof.recommendation.rationale} />
                )}
                {roof.recommendation.net_installable_m2 != null && (
                  <Field label="Surface installable nette" value={`${roof.recommendation.net_installable_m2} m²`} />
                )}
              </div>
            )}
            {!roof && (
              <p className="text-sm text-muted-foreground">
                Analyse en cours ou non démarrée.
              </p>
            )}

            {Array.isArray(lead.roof_photos_urls) && lead.roof_photos_urls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3">
                {lead.roof_photos_urls.map((p, i) => (
                  <PhotoBlock
                    key={p}
                    path={p}
                    url={getUrl(p)}
                    loading={urlsLoading}
                    label={`Toit ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {canRelaunch && (
              <div className="pt-3 border-t border-border mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRelaunchRoof}
                  disabled={reanalyzing}
                  className="border-primary/40 text-primary hover:bg-primary/5"
                >
                  {reanalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyse en cours…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Relancer l'analyse IA du toit
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Édition admin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Suivi commercial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full sm:w-[240px]">
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
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes internes</label>
              <Textarea
                rows={5}
                placeholder="Compte-rendu d'appel, RDV programmé, objections…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Enregistrer
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};
