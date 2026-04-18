import { Link } from "react-router-dom";
import { ArrowRight, Sun, Gauge, ShieldCheck, Sparkles, UserRoundCheck } from "lucide-react";
import { Navbar } from "@/components/sunavio/Navbar";
import { Footer } from "@/components/sunavio/Footer";
import { Button } from "@/components/ui/button";
import { SunavioCard } from "@/components/sunavio/SunavioCard";
import { SectionHeader } from "@/components/sunavio/SectionHeader";
import heroImage from "@/assets/hero-villa.jpg";

const steps = [
  {
    n: "01",
    title: "Votre consommation",
    text: "Photographiez votre facture ONEE ou saisissez vos kWh. Notre système lit automatiquement les informations essentielles.",
  },
  {
    n: "02",
    title: "Votre habitation",
    text: "Adresse, type de toit, quelques photos prises avec votre téléphone. Rien de plus.",
  },
  {
    n: "03",
    title: "Votre étude",
    text: "Recevez instantanément la puissance recommandée, la production estimée, le budget et le retour sur investissement.",
  },
];

const pillars = [
  {
    icon: Gauge,
    title: "Dimensionnement réel",
    text: "Basé sur votre consommation réelle ONEE, l'ensoleillement précis de votre localisation, et les caractéristiques de votre toit. Pas une estimation générique.",
  },
  {
    icon: ShieldCheck,
    title: "Honnêteté radicale",
    text: "Si le solaire n'est pas rentable pour votre situation, nous vous le disons. Notre réputation vaut plus qu'une vente forcée.",
  },
  {
    icon: Sparkles,
    title: "Matériel premium",
    text: "Panneaux Jinko Tiger Neo 630W bifaciaux, onduleurs WeCo, stockage haute résilience. Les mêmes équipements que pour nos villas de luxe.",
  },
  {
    icon: UserRoundCheck,
    title: "Suivi humain",
    text: "Après votre étude en ligne, un ingénieur SUNAVIO vous rappelle pour une visite technique gratuite. Pas un commercial, un expert.",
  },
];

const projects = [
  { name: "Golf Assoufid", power: "50 kWc", type: "Micro-réseau solaire", city: "Marrakech" },
  { name: "Villa Pinto", power: "19,5 kWc", type: "Résidentiel premium", city: "Al Maaden" },
  { name: "Résidence Aguerd", power: "3,15 kWc", type: "Résidentiel", city: "Essaouira" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative min-h-screen flex items-center pt-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Villa marocaine premium équipée en solaire au coucher du soleil"
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-background/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>

        <div className="relative container py-20 md:py-32 max-w-4xl">
          <p className="text-xs uppercase tracking-[0.4em] text-primary mb-6 animate-fade-in">
            SUNAVIO — Ingénierie solaire premium
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.05] mb-8 animate-fade-up">
            Votre étude solaire
            <br />
            <span className="text-primary">personnalisée</span> en 5 minutes
          </h1>
          <span className="gold-rule mb-8" />
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10 animate-fade-up">
            L'ingénierie solaire premium SUNAVIO, désormais accessible. Gratuit, sans engagement, par les ingénieurs qui équipent les villas et hôtels les plus exigeants du Maroc.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up">
            <Button asChild variant="primary" size="xl" className="group">
              <Link to="/estimer">
                Démarrer mon estimation
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground/80 tracking-wide">
            Étude réalisée en moins de 5 minutes · 100% gratuite · Sans email avant la fin
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 md:py-32">
        <div className="container">
          <SectionHeader
            eyebrow="Comment ça fonctionne"
            title="3 étapes, 5 minutes, zéro friction"
            subtitle="Une démarche pensée pour votre temps, conduite avec la rigueur d'une étude d'ingénierie."
          />

          <div className="mt-20 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <SunavioCard key={s.n} className="flex flex-col">
                <span className="font-display text-6xl md:text-7xl text-primary/90 leading-none mb-6">
                  {s.n}
                </span>
                <h3 className="font-display text-xl text-foreground mb-3">{s.title}</h3>
                <span className="gold-rule mb-4" />
                <p className="text-muted-foreground leading-relaxed">{s.text}</p>
              </SunavioCard>
            ))}
          </div>
        </div>
      </section>

      {/* WHY DIFFERENT */}
      <section className="py-24 md:py-32 bg-card/30">
        <div className="container">
          <SectionHeader
            eyebrow="Notre différence"
            title="Une expertise d'ingénieurs, pas un formulaire de devis"
          />

          <div className="mt-20 grid gap-6 md:grid-cols-2 max-w-5xl mx-auto">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <SunavioCard key={p.title} className="flex gap-6">
                  <div className="shrink-0">
                    <div className="size-12 border border-primary/40 flex items-center justify-center">
                      <Icon className="size-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-foreground mb-3">{p.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{p.text}</p>
                  </div>
                </SunavioCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROJECTS */}
      <section className="py-24 md:py-32" id="projets">
        <div className="container">
          <SectionHeader
            eyebrow="Références"
            title="Ils nous ont fait confiance"
            subtitle="Des projets emblématiques, conçus et réalisés par les équipes SUNAVIO."
          />

          <div className="mt-20 grid gap-6 md:grid-cols-3">
            {projects.map((p) => (
              <SunavioCard key={p.name} withGoldCorners className="text-center py-12 relative overflow-hidden">
                <Sun className="size-32 text-primary/[0.04] absolute -right-6 -bottom-6" strokeWidth={1} />
                <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4 relative">
                  {p.type}
                </p>
                <h3 className="font-display text-2xl md:text-3xl text-foreground mb-3 relative">
                  {p.name}
                </h3>
                <span className="gold-rule mx-auto mb-4" />
                <p className="text-3xl font-display text-primary mb-2 relative">{p.power}</p>
                <p className="text-sm text-muted-foreground tracking-wide relative">{p.city}</p>
              </SunavioCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-warmdark py-28 md:py-40 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-transparent to-background/40" />
        <div className="container relative text-center max-w-3xl">
          <h2 className="font-display text-4xl md:text-6xl text-foreground leading-[1.1] mb-8">
            Prêt à reprendre le contrôle de votre énergie&nbsp;?
          </h2>
          <span className="gold-rule mx-auto mb-8" />
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            Votre étude solaire vous attend. 5 minutes, aucune donnée personnelle avant la fin.
          </p>
          <Button asChild variant="primary" size="xl" className="group">
            <Link to="/estimer">
              Démarrer mon estimation
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
