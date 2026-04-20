import { LegalLayout } from "@/components/legal/LegalLayout";

const UPDATED_AT = "20 avril 2026";

const PolitiqueConfidentialite = () => (
  <LegalLayout title="Politique de confidentialité" updatedAt={UPDATED_AT}>
    <p>
      SUNAVIO SARL accorde une importance particulière à la protection de vos données
      personnelles. La présente politique détaille les informations collectées, les
      finalités de leur traitement, vos droits et les moyens de les exercer.
    </p>
    <p>
      <strong>Statut de conformité CNDP (Maroc) :</strong> Ce traitement de données
      personnelles fait actuellement l'objet d'un dépôt de déclaration auprès de la
      Commission Nationale de contrôle de la protection des Données à caractère
      Personnel (CNDP). Le récépissé sera publié sur cette page dès son obtention.
    </p>

    <h2>1. Responsable du traitement</h2>
    <p>
      <strong>SUNAVIO SARL</strong>, représentée par Anthony NEBOUT, Co-fondateur, est
      responsable du traitement de vos données personnelles collectées via le Site.
    </p>
    <p>
      <strong>Contact pour les questions relatives aux données personnelles :</strong>
      <br />
      <a href="mailto:sunavio.contact@gmail.com">sunavio.contact@gmail.com</a>{" "}
      (objet à préciser : « Protection des données personnelles »)
    </p>

    <h2>2. Données collectées</h2>
    <p>Dans le cadre de l'estimation solaire en ligne, nous collectons :</p>
    <h3>Données d'identification</h3>
    <ul>
      <li>Nom et prénom</li>
      <li>Numéro de téléphone (WhatsApp de préférence)</li>
      <li>Adresse email (facultative)</li>
    </ul>
    <h3>Données techniques liées à votre projet</h3>
    <ul>
      <li>Adresse postale de l'installation envisagée</li>
      <li>Coordonnées géographiques (latitude/longitude) dérivées de l'adresse</li>
      <li>
        Type de logement et caractéristiques (surface, type de toit, présence de
        climatisation, piscine, véhicule électrique)
      </li>
      <li>Consommation électrique (issue de votre facture ONEE ou saisie manuelle)</li>
      <li>Photographies de votre toiture (facultatives)</li>
      <li>Photographie ou PDF de votre facture ONEE (facultatif)</li>
    </ul>
    <h3>Données techniques automatiques</h3>
    <ul>
      <li>
        Adresse IP (stockée sous forme hashée SHA-256 pour limitation d'abus
        uniquement)
      </li>
      <li>Date et heure de soumission</li>
    </ul>

    <h2>3. Finalités du traitement</h2>
    <table>
      <thead>
        <tr>
          <th>Finalité</th>
          <th>Base légale (RGPD)</th>
          <th>Durée de conservation</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Génération de votre pré-étude solaire personnalisée</td>
          <td>Exécution de mesures pré-contractuelles (art. 6.1.b RGPD)</td>
          <td>Durée du traitement + 3 mois</td>
        </tr>
        <tr>
          <td>Prise de contact commercial par un ingénieur SUNAVIO</td>
          <td>Consentement (art. 6.1.a RGPD) et intérêt légitime</td>
          <td>24 mois après dernier contact</td>
        </tr>
        <tr>
          <td>Analyse technique des documents soumis (facture, photos)</td>
          <td>Exécution de mesures pré-contractuelles</td>
          <td>Durée du traitement</td>
        </tr>
        <tr>
          <td>Protection contre les abus (rate-limiting sur IP hashée)</td>
          <td>Intérêt légitime de sécurité</td>
          <td>30 jours</td>
        </tr>
        <tr>
          <td>Amélioration du service</td>
          <td>Intérêt légitime</td>
          <td>Données anonymisées</td>
        </tr>
      </tbody>
    </table>

    <h2>4. Destinataires des données</h2>
    <p>Vos données sont transmises exclusivement à :</p>
    <ul>
      <li>
        <strong>L'équipe SUNAVIO SARL</strong> (Anthony NEBOUT, Imane ZNIN et
        collaborateurs habilités) pour le traitement commercial de votre projet
      </li>
      <li>
        <strong>Lovable Cloud (Supabase)</strong>, notre hébergeur technique, situé à
        Singapour avec serveurs en Irlande (UE) — soumis à des clauses contractuelles
        types garantissant un niveau de protection équivalent au RGPD
      </li>
      <li>
        <strong>Google LLC</strong> (USA) via ses API Maps, Places et Geocoding pour la
        géolocalisation de votre adresse — soumis au Data Privacy Framework UE-USA
      </li>
      <li>
        <strong>Google LLC</strong> (USA) via son API Gemini pour l'analyse IA de votre
        facture, l'analyse de vos photos de toiture et la génération de votre message
        personnalisé — soumis au Data Privacy Framework UE-USA
      </li>
    </ul>
    <p>
      <strong>
        Vos données ne sont jamais vendues, louées ou cédées à des tiers à des fins
        commerciales.
      </strong>
    </p>

    <h2>5. Transferts hors Union européenne</h2>
    <p>
      Certaines de vos données peuvent être transférées vers des pays hors UE (Maroc,
      Singapour, États-Unis). Ces transferts s'effectuent sur la base :
    </p>
    <ul>
      <li>
        De l'accord Data Privacy Framework UE-USA pour les transferts vers Google LLC
      </li>
      <li>
        De clauses contractuelles types approuvées par la Commission européenne pour
        Lovable Cloud
      </li>
      <li>
        Du fait que le Maroc, pays de résidence de SUNAVIO SARL, est doté d'une
        législation sur la protection des données (loi 09-08) et d'une autorité de
        contrôle (CNDP)
      </li>
    </ul>

    <h2>6. Vos droits</h2>
    <p>
      Conformément au RGPD et à la loi marocaine 09-08, vous disposez des droits
      suivants :
    </p>
    <ul>
      <li>
        <strong>Droit d'accès</strong> (art. 15 RGPD) : obtenir confirmation que vos
        données sont traitées et en recevoir une copie
      </li>
      <li>
        <strong>Droit de rectification</strong> (art. 16 RGPD) : faire corriger des
        données inexactes
      </li>
      <li>
        <strong>Droit à l'effacement</strong> (art. 17 RGPD, « droit à l'oubli ») :
        obtenir la suppression de vos données
      </li>
      <li>
        <strong>Droit à la limitation du traitement</strong> (art. 18 RGPD) : suspendre
        temporairement le traitement
      </li>
      <li>
        <strong>Droit à la portabilité</strong> (art. 20 RGPD) : recevoir vos données
        dans un format structuré et lisible par machine
      </li>
      <li>
        <strong>Droit d'opposition</strong> (art. 21 RGPD) : vous opposer au traitement
        pour des raisons tenant à votre situation particulière
      </li>
      <li>
        Droit de retirer votre consentement à tout moment pour les traitements basés
        sur cette base légale
      </li>
      <li>
        Droit d'introduire une réclamation auprès d'une autorité de contrôle :
        <ul>
          <li>
            <strong>Maroc</strong> :{" "}
            <a href="https://www.cndp.ma" target="_blank" rel="noopener noreferrer">
              CNDP — www.cndp.ma
            </a>
          </li>
          <li>
            <strong>France</strong> :{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
              CNIL — www.cnil.fr
            </a>
          </li>
        </ul>
      </li>
    </ul>
    <p>
      <strong>Pour exercer vos droits :</strong>
    </p>
    <ul>
      <li>
        Directement en ligne via le lien personnel envoyé dans votre email de
        confirmation
      </li>
      <li>
        Par email à{" "}
        <a href="mailto:sunavio.contact@gmail.com">sunavio.contact@gmail.com</a>{" "}
        (objet : « Exercice de mes droits personnels »)
      </li>
      <li>
        Par courrier à : SUNAVIO SARL, Villa 7 Résidence Safaa Ouidane, 40000
        Marrakech, Maroc
      </li>
    </ul>
    <p>
      Nous répondons à toute demande dans un délai maximum de <strong>30 jours</strong>.
      Une pièce d'identité pourra être demandée en cas de doute sur l'identité du
      demandeur.
    </p>

    <h2>7. Sécurité des données</h2>
    <p>
      Nous mettons en œuvre des mesures techniques et organisationnelles appropriées
      pour protéger vos données :
    </p>
    <ul>
      <li>Chiffrement des communications en transit (HTTPS/TLS 1.3)</li>
      <li>Chiffrement au repos de la base de données</li>
      <li>Contrôle d'accès strict via Row Level Security (RLS)</li>
      <li>
        URLs signées temporaires (1 heure) pour l'accès aux fichiers par l'équipe
        SUNAVIO
      </li>
      <li>Limitation du nombre de soumissions par IP hashée pour prévenir les abus</li>
      <li>Masquage des IP (hashage SHA-256 irréversible)</li>
      <li>Traçabilité des accès admin</li>
      <li>Sauvegardes quotidiennes</li>
    </ul>

    <h2>8. Cookies et technologies similaires</h2>
    <p>
      Voir notre <a href="/cookies">Politique des cookies</a> pour plus de détails. Le
      Site utilise exclusivement des cookies strictement nécessaires au fonctionnement.
      Aucun cookie marketing, tracking ou analytics tiers sans consentement explicite.
    </p>

    <h2>9. Mineurs</h2>
    <p>
      Le Site n'est pas destiné aux personnes de moins de 18 ans. Nous ne collectons
      pas sciemment de données personnelles concernant des mineurs.
    </p>

    <h2>10. Modifications de la présente politique</h2>
    <p>
      Cette politique peut être modifiée. En cas de modification substantielle, les
      utilisateurs ayant soumis un lead seront informés par email. La date de dernière
      mise à jour figure en tête de document.
    </p>

    <h2>11. Contact DPO</h2>
    <p>
      Pour toute question relative à la protection de vos données :
      <br />
      <strong>Anthony NEBOUT, Co-fondateur et Délégué à la Protection des Données</strong>
      <br />
      Email :{" "}
      <a href="mailto:sunavio.contact@gmail.com">sunavio.contact@gmail.com</a> (objet :
      « Protection des données personnelles »)
    </p>
  </LegalLayout>
);

export default PolitiqueConfidentialite;
