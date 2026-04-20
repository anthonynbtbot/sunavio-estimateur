import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Estimer from "./pages/Estimer.tsx";
import Resultat from "./pages/Resultat.tsx";
import Admin from "./pages/Admin.tsx";
import AdminLead from "./pages/AdminLead.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import MentionsLegales from "./pages/legal/MentionsLegales.tsx";
import PolitiqueConfidentialite from "./pages/legal/PolitiqueConfidentialite.tsx";
import ConditionsGenerales from "./pages/legal/ConditionsGenerales.tsx";
import Cookies from "./pages/legal/Cookies.tsx";
import { CookieBanner } from "./components/legal/CookieBanner.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/estimer" element={<Estimer />} />
          <Route path="/resultat" element={<Resultat />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/leads/:id" element={<AdminLead />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/politique-confidentialite" element={<PolitiqueConfidentialite />} />
          <Route path="/conditions-generales" element={<ConditionsGenerales />} />
          <Route path="/cookies" element={<Cookies />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <CookieBanner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
