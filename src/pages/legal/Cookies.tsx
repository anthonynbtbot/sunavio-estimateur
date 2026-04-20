import { LegalLayout } from "@/components/legal/LegalLayout";

const UPDATED_AT = "20 avril 2026";

const Cookies = () => (
  <LegalLayout title="Politique des cookies" updatedAt={UPDATED_AT}>
    <h2>1. Qu'est-ce qu'un cookie ?</h2>
    <p>
      Un cookie est un petit fichier texte déposé sur votre appareil lors de votre
      visite sur un site web, permettant de mémoriser vos préférences ou d'analyser
      votre utilisation du site.
    </p>

    <h2>2. Cookies utilisés sur le Site SUNAVIO</h2>
    <h3>2.1 Cookies strictement nécessaires (pas de consentement requis)</h3>
    <p>Ces cookies sont indispensables au fonctionnement du Site.</p>
    <table>
      <thead>
        <tr>
          <th>Cookie</th>
          <th>Finalité</th>
          <th>Durée</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <code>sb-*-auth-token</code>
          </td>
          <td>Session pour l'admin SUNAVIO uniquement</td>
          <td>1 heure</td>
        </tr>
        <tr>
          <td>Stockage local (Zustand)</td>
          <td>Sauvegarde temporaire des données d'estimation</td>
          <td>Session</td>
        </tr>
        <tr>
          <td>
            <code>cookie_consent_acknowledged</code>
          </td>
          <td>Mémorisation de la prise de connaissance de la bannière cookies</td>
          <td>12 mois</td>
        </tr>
      </tbody>
    </table>

    <h3>2.2 Cookies tiers — aucun actuellement</h3>
    <p>
      Le Site SUNAVIO <strong>n'utilise aucun cookie de mesure d'audience, publicité,
      profilage ou tracking tiers</strong> à ce jour. Si de tels cookies étaient
      ajoutés à l'avenir, un consentement explicite serait demandé via un bandeau.
    </p>

    <h2>3. Vos choix</h2>
    <p>
      Vous pouvez configurer votre navigateur pour accepter, refuser ou supprimer les
      cookies. Le refus des cookies strictement nécessaires peut empêcher certaines
      fonctionnalités (connexion admin, soumission d'un lead).
    </p>

    <h2>4. Contact</h2>
    <p>
      <a href="mailto:sunavio.contact@gmail.com">sunavio.contact@gmail.com</a>
    </p>
  </LegalLayout>
);

export default Cookies;
