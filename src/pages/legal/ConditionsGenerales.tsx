import { LegalLayout } from "@/components/legal/LegalLayout";

const UPDATED_AT = "20 avril 2026";

const ConditionsGenerales = () => (
  <LegalLayout title="Conditions Générales d'Utilisation" updatedAt={UPDATED_AT}>
    <p>
      Les présentes CGU régissent l'utilisation du site{" "}
      <strong>sunavio.ma / sunavio.fr / sunavio.com</strong> édité par SUNAVIO SARL.{" "}
      <strong>
        L'utilisation du Site implique l'acceptation pleine et entière des présentes
        CGU.
      </strong>
    </p>

    <h2>1. Objet du Site</h2>
    <p>Le Site a pour objet de permettre à tout visiteur de :</p>
    <ul>
      <li>
        Obtenir une pré-estimation solaire personnalisée basée sur les informations
        qu'il soumet
      </li>
      <li>
        Entrer en contact avec un ingénieur SUNAVIO pour un accompagnement commercial
      </li>
      <li>S'informer sur les services proposés par SUNAVIO SARL</li>
    </ul>
    <p>
      <strong>Le Site ne constitue pas une offre commerciale ferme.</strong> Seul un
      devis écrit signé par SUNAVIO SARL et accepté par le client a valeur
      contractuelle.
    </p>

    <h2>2. Accès au Site</h2>
    <p>
      L'accès au Site est <strong>gratuit</strong>. Les coûts de connexion restent à la
      charge de l'utilisateur. Le Site est accessible 24h/24 et 7j/7, sauf cas de force
      majeure, interruptions pour maintenance, ou événements hors de notre contrôle.
    </p>

    <h2>3. Utilisation du Site</h2>
    <p>L'utilisateur s'engage à :</p>
    <ul>
      <li>Utiliser le Site de bonne foi et conformément à sa destination</li>
      <li>Ne soumettre que des informations exactes et à jour</li>
      <li>
        Ne pas soumettre de contenus illicites, diffamatoires, injurieux, ou violant
        les droits de tiers
      </li>
      <li>Ne pas tenter de porter atteinte au fonctionnement du Site</li>
      <li>
        Ne pas automatiser l'utilisation du Site via des robots ou scripts sans
        autorisation
      </li>
    </ul>

    <h2>4. Qualité des informations fournies</h2>
    <p>
      L'utilisateur reconnaît que la pertinence de la pré-étude dépend directement de
      la qualité des informations qu'il fournit. SUNAVIO SARL décline toute
      responsabilité en cas d'estimation erronée résultant d'informations inexactes
      communiquées par l'utilisateur.
    </p>

    <h2>5. Propriété intellectuelle</h2>
    <p>
      Tous les éléments du Site sont la propriété exclusive de SUNAVIO SARL.
      L'utilisateur conserve la propriété intellectuelle des contenus qu'il soumet
      (photos, factures), mais concède à SUNAVIO SARL une <strong>licence limitée, non
      exclusive et gratuite</strong> d'utiliser ces contenus aux seules fins de
      génération de la pré-étude et de prise de contact commercial.
    </p>

    <h2>6. Limitation de responsabilité</h2>
    <p>
      Dans les limites autorisées par la loi applicable, SUNAVIO SARL ne saurait être
      tenue responsable :
    </p>
    <ul>
      <li>Des pertes ou dommages indirects résultant de l'utilisation du Site</li>
      <li>Des erreurs ou inexactitudes dans les informations disponibles</li>
      <li>Des interruptions temporaires dues à des opérations de maintenance</li>
      <li>Des dysfonctionnements résultant de l'équipement de l'utilisateur</li>
      <li>
        Des contenus de sites tiers vers lesquels des liens hypertextes pourraient
        renvoyer
      </li>
    </ul>

    <h2>7. Droit applicable et juridiction</h2>
    <p>
      Les présentes CGU sont régies par le <strong>droit marocain</strong>. Tout litige
      sera de la compétence exclusive du <strong>Tribunal de Commerce de Marrakech</strong>,
      sous réserve des dispositions impératives protégeant les consommateurs résidant
      dans l'Union européenne.
    </p>

    <h2>8. Modifications des CGU</h2>
    <p>
      SUNAVIO SARL se réserve le droit de modifier les présentes CGU à tout moment. Les
      modifications prennent effet à leur publication sur le Site.
    </p>

    <h2>9. Contact</h2>
    <p>
      <a href="mailto:sunavio.contact@gmail.com">sunavio.contact@gmail.com</a>
    </p>
  </LegalLayout>
);

export default ConditionsGenerales;
