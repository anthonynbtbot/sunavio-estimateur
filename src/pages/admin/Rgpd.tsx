import { ProtectedAdmin } from "@/components/admin/ProtectedAdmin";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

/**
 * Registre des traitements RGPD (Article 30) — SUNAVIO SARL
 * Conforme RGPD (UE), Loi 09-08 (Maroc) et LCEN (France).
 * Tenu à jour par le DPO. Doit être présenté à la CNDP/CNIL sur demande.
 */

type Traitement = {
  nom: string;
  finalite: string;
  baseLegale: string;
  categories: string[];
  destinataires: string;
  duree: string;
  transferts: string;
  securite: string[];
};

const traitements: Traitement[] = [
  {
    nom: "Estimation solaire en ligne",
    finalite:
      "Calculer une étude personnalisée d'installation photovoltaïque à partir des données fournies par le prospect.",
    baseLegale: "Consentement explicite (Art. 6.1.a RGPD) — case obligatoire à l'étape 5.",
    categories: [
      "Identité (nom, prénom)",
      "Contact (téléphone, email optionnel)",
      "Adresse (texte, latitude/longitude, ville)",
      "Consommation électrique (kWh/mois, type contrat)",
      "Caractéristiques logement (type, toiture, équipements)",
      "Photos toiture et facture (URLs storage privé)",
    ],
    destinataires:
      "Équipe commerciale SUNAVIO SARL uniquement. Aucune cession à des tiers commerciaux.",
    duree:
      "24 mois après dernière interaction (suppression automatique ou sur demande via /me/delete).",
    transferts:
      "Hébergement Lovable Cloud (UE — conformité RGPD). IA Google Gemini pour analyse de toiture/facture (transfert UE→US encadré par clauses contractuelles types).",
    securite: [
      "RLS Postgres (Row Level Security)",
      "Bucket storage privé + URLs signées (TTL 1h)",
      "Rate limiting IP (5 leads/h)",
      "Authentification admin par email + rôle dédié",
      "Token self-service unique (UUID v4) par lead",
      "HTTPS obligatoire",
    ],
  },
  {
    nom: "Contact commercial",
    finalite:
      "Recontacter le prospect pour finaliser l'étude et proposer un devis détaillé.",
    baseLegale:
      "Consentement explicite distinct (Art. 6.1.a RGPD) — case obligatoire séparée à l'étape 5.",
    categories: ["Téléphone", "Email (si fourni)", "Résultats de l'estimation"],
    destinataires: "Équipe commerciale SUNAVIO SARL uniquement.",
    duree:
      "24 mois après dernière interaction. Retrait du consentement possible à tout moment via /me/delete.",
    transferts: "Aucun transfert hors UE pour ce traitement.",
    securite: [
      "Accès restreint aux comptes admin authentifiés",
      "Log d'accès (timestamps)",
    ],
  },
  {
    nom: "Gestion des cookies & traçabilité technique",
    finalite:
      "Mémoriser le consentement aux conditions et assurer le bon fonctionnement du site (session, anti-abus).",
    baseLegale:
      "Cookies strictement nécessaires (Art. 82 LCEN / Art. 6.1.f RGPD intérêt légitime).",
    categories: ["Identifiant de session", "Hash IP (anti-spam)", "Préférence cookie banner"],
    destinataires: "SUNAVIO SARL.",
    duree: "12 mois pour la préférence cookie. 1h pour le hash IP (rate limiting).",
    transferts: "Aucun.",
    securite: ["Hash SHA-256 de l'IP (non réversible)", "Pas de cookie publicitaire ni tracker tiers"],
  },
  {
    nom: "Administration & supervision",
    finalite: "Gérer les leads entrants, suivre la performance commerciale, debug technique.",
    baseLegale: "Intérêt légitime (Art. 6.1.f RGPD) — gestion interne de l'entreprise.",
    categories: ["Toutes les données collectées ci-dessus", "Logs techniques (system_logs)"],
    destinataires: "Administrateurs SUNAVIO SARL identifiés (rôle 'admin' en base).",
    duree: "Logs techniques : 90 jours. Données lead : 24 mois.",
    transferts: "Hébergement Lovable Cloud (UE).",
    securite: [
      "Authentification email + mot de passe",
      "Rôle admin séparé (table user_roles)",
      "Function security definer has_role()",
    ],
  },
];

const RgpdContent = () => (
  <div className="min-h-screen bg-background py-10 px-4 md:px-8">
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'admin
        </Link>
        <Badge variant="outline" className="gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Confidentiel — Usage interne
        </Badge>
      </div>

      <header className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
          Registre des traitements
        </h1>
        <p className="text-muted-foreground">
          Article 30 RGPD — Loi 09-08 (Maroc) — LCEN (France). Document interne tenu par
          le responsable de traitement <strong>SUNAVIO SARL</strong>. À présenter sur demande à la
          CNDP, à la CNIL ou à toute autorité de contrôle compétente.
        </p>
      </header>

      <Card className="p-6 space-y-2 bg-muted/30">
        <h2 className="font-semibold">Responsable de traitement</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
          <div><dt className="inline text-muted-foreground">Raison sociale : </dt><dd className="inline font-medium">SUNAVIO SARL</dd></div>
          <div><dt className="inline text-muted-foreground">Siège : </dt><dd className="inline font-medium">Villa 7 Résidence Safaa Ouidane, 40000 Marrakech, Maroc</dd></div>
          <div><dt className="inline text-muted-foreground">ICE : </dt><dd className="inline font-medium">003721552000008</dd></div>
          <div><dt className="inline text-muted-foreground">RC : </dt><dd className="inline font-medium">164901 Marrakech</dd></div>
          <div><dt className="inline text-muted-foreground">IF : </dt><dd className="inline font-medium">66967281</dd></div>
          <div><dt className="inline text-muted-foreground">DPO / Contact : </dt><dd className="inline font-medium">sunavio.contact@gmail.com</dd></div>
          <div><dt className="inline text-muted-foreground">Déclaration CNDP : </dt><dd className="inline font-medium">en cours de dépôt</dd></div>
          <div><dt className="inline text-muted-foreground">Dernière mise à jour : </dt><dd className="inline font-medium">{new Date().toLocaleDateString("fr-FR")}</dd></div>
        </dl>
      </Card>

      <section className="space-y-5">
        {traitements.map((t, i) => (
          <Card key={t.nom} className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-2">Traitement n°{i + 1}</Badge>
                <h3 className="text-xl font-semibold">{t.nom}</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
              <Field label="Finalité" value={t.finalite} />
              <Field label="Base légale" value={t.baseLegale} />
              <Field label="Destinataires" value={t.destinataires} />
              <Field label="Durée de conservation" value={t.duree} />
              <Field label="Transferts hors UE" value={t.transferts} className="md:col-span-2" />

              <div className="md:col-span-2 space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Catégories de données
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-foreground">
                  {t.categories.map((c) => <li key={c}>{c}</li>)}
                </ul>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  Mesures de sécurité
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-foreground">
                  {t.securite.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Card className="p-6 space-y-3 border-dashed">
        <h2 className="font-semibold">Droits des personnes concernées</h2>
        <p className="text-sm text-muted-foreground">
          Conformément aux Art. 15 à 22 du RGPD et aux Art. 7 à 9 de la Loi 09-08, toute personne
          dispose des droits d'accès, de rectification, d'effacement, de portabilité, de
          limitation et d'opposition.
        </p>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>Self-service export (Art. 20 RGPD) : <code className="px-1.5 py-0.5 rounded bg-muted text-xs">/me/export?token=…</code></li>
          <li>Self-service suppression (Art. 17 RGPD) : <code className="px-1.5 py-0.5 rounded bg-muted text-xs">/me/delete?token=…</code></li>
          <li>Réclamation auprès de la <strong>CNDP</strong> (Maroc) ou de la <strong>CNIL</strong> (France).</li>
        </ul>
      </Card>
    </div>
  </div>
);

const Field = ({ label, value, className = "" }: { label: string; value: string; className?: string }) => (
  <div className={`space-y-1 ${className}`}>
    <p className="text-muted-foreground text-xs uppercase tracking-wider">{label}</p>
    <p className="text-foreground leading-relaxed">{value}</p>
  </div>
);

const Rgpd = () => (
  <ProtectedAdmin>
    <RgpdContent />
  </ProtectedAdmin>
);

export default Rgpd;