import { Navbar } from "@/components/sunavio/Navbar";
import { Footer } from "@/components/sunavio/Footer";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

const PlaceholderPage = ({ title, description }: PlaceholderPageProps) => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1 flex items-center justify-center pt-32 pb-20">
      <div className="container max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-primary mb-6">
          Bientôt disponible
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-foreground mb-6">
          {title}
        </h1>
        <span className="gold-rule mx-auto" />
        <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
          {description}
        </p>
        <Button asChild variant="goldOutline" className="mt-10">
          <Link to="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </main>
    <Footer />
  </div>
);

export default PlaceholderPage;
