import { ReactNode } from "react";
import { Navbar } from "@/components/sunavio/Navbar";
import { Footer } from "@/components/sunavio/Footer";

interface LegalLayoutProps {
  title: string;
  updatedAt: string;
  children: ReactNode;
}

export const LegalLayout = ({ title, updatedAt, children }: LegalLayoutProps) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="container max-w-3xl pt-32 pb-24">
      <p className="text-xs uppercase tracking-[0.4em] text-primary mb-4">
        SUNAVIO — Information légale
      </p>
      <h1 className="font-display text-3xl md:text-5xl text-foreground leading-tight mb-4">
        {title}
      </h1>
      <p className="text-sm text-muted-foreground mb-2">
        Date de dernière mise à jour : {updatedAt}
      </p>
      <span className="gold-rule mb-10 block" />
      <div
        className="legal-content text-foreground/90 leading-relaxed
          [&_h2]:font-display [&_h2]:text-2xl [&_h2]:md:text-3xl [&_h2]:text-foreground [&_h2]:mt-12 [&_h2]:mb-4
          [&_h3]:font-display [&_h3]:text-xl [&_h3]:text-foreground [&_h3]:mt-8 [&_h3]:mb-3
          [&_p]:text-muted-foreground [&_p]:mb-4 [&_p]:leading-relaxed
          [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul>li]:text-muted-foreground [&_ul>li]:mb-2
          [&_a]:text-primary [&_a]:underline hover:[&_a]:text-primary-hover
          [&_strong]:text-foreground [&_strong]:font-medium
          [&_table]:w-full [&_table]:my-6 [&_table]:text-sm [&_table]:border-collapse
          [&_th]:text-left [&_th]:p-3 [&_th]:border-b [&_th]:border-border [&_th]:text-foreground [&_th]:font-medium
          [&_td]:p-3 [&_td]:border-b [&_td]:border-border/50 [&_td]:text-muted-foreground [&_td]:align-top"
      >
        {children}
      </div>
    </main>
    <Footer />
  </div>
);
