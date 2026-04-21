import { LegalLayout } from "@/components/legal/LegalLayout";

const UPDATED_AT = "20 avril 2026";

const MentionsLegales = () => (
  <LegalLayout title="Mentions légales" updatedAt={UPDATED_AT}>
    <h2>1. Éditeur du site</h2>
    <p>
      Le site <strong>sunavio.ma / sunavio.fr / sunavio.com</strong> (ci-après « le Site ») est
      édité par :
    </p>
    <p>
      <strong>SUNAVIO SARL</strong>
      <br />
      Société à responsabilité limitée au capital de 100 000,00 MAD
      <br />
      Siège social : Zenith Business Center, Rue Mouslim, Lot Boukar, 3ème
      étage, Apt N°14, Bab Doukala, Marrakech-Guéliz, Maroc
      <br />
      ICE : 003721552000008
      <br />
      RC : 164901 Marrakech
      <br />
      IF : 66967281
      <br />
      TP : 45315807
      <br />
      Représentée par : Anthony NEBOUT, Co-fondateur
    </p>
    <p>
      <strong>Contact :</strong>
      <br />
      Téléphone : +212 06 63 28 44 44
      <br />
      Email :{" "}
      <a href="mailto:sunavio.contact@gmail.com">sunavio.contact@gmail.com</a>
    </p>

    <h2>2. Directeur de la publication</h2>
    <p>Anthony NEBOUT, Co-fondateur de SUNAVIO SARL.</p>

    <h2>3. Hébergement</h2>
    <p>
      Le Site est hébergé par <strong>Lovable Cloud</strong> (infrastructure Supabase)
      <br />
      Supabase, Inc. — 970 Toa Payoh North, #07-04, Singapour 318992.
    </p>

    <h2>4. Propriété intellectuelle</h2>
    <p>
      L'ensemble des éléments constituant le Site (textes, graphismes, logo SUNAVIO,
      photographies, icônes, interfaces) sont la propriété exclusive de SUNAVIO SARL ou
      de ses partenaires, et sont protégés par les législations marocaine, française et
      internationale relatives à la propriété intellectuelle.
    </p>
    <p>
      Toute reproduction, représentation, modification, publication, adaptation, totale
      ou partielle des éléments du Site, quel que soit le moyen ou procédé utilisé, est
      interdite sans autorisation préalable écrite de SUNAVIO SARL.
    </p>

    <h2>5. Contenus fournis par l'utilisateur</h2>
    <p>
      L'utilisateur qui soumet des contenus (factures d'électricité, photographies de
      toiture, coordonnées) garantit qu'il détient les droits nécessaires sur ces
      contenus et qu'ils ne portent pas atteinte aux droits de tiers. SUNAVIO SARL ne
      saurait être tenue responsable des contenus soumis par les utilisateurs.
    </p>

    <h2>6. Limitation de responsabilité</h2>
    <p>
      Les estimations techniques et financières générées par le Site sont{" "}
      <strong>indicatives</strong> et ne constituent pas un engagement contractuel.
      Toute installation photovoltaïque fait l'objet d'une visite technique gratuite et
      d'un devis ferme détaillé, seul document ayant valeur contractuelle.
    </p>
    <p>
      SUNAVIO SARL s'efforce de maintenir le Site accessible et à jour mais ne garantit
      pas son fonctionnement sans interruption ni son exactitude absolue.
    </p>

    <h2>7. Droit applicable et juridiction compétente</h2>
    <p>
      Les présentes mentions légales sont régies par le droit marocain. Tout litige
      relatif au Site ou à son utilisation sera de la compétence exclusive du{" "}
      <strong>Tribunal de Commerce de Marrakech</strong>, sauf disposition contraire
      d'ordre public applicable au consommateur résidant dans un pays de l'Union
      européenne.
    </p>

    <h2>8. Contact</h2>
    <p>
      Pour toute question relative aux présentes mentions légales, contactez :{" "}
      <a href="mailto:sunavio.contact@gmail.com">sunavio.contact@gmail.com</a>
    </p>
  </LegalLayout>
);

export default MentionsLegales;
