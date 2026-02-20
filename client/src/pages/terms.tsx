import { FileText, CheckCircle, AlertCircle, Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-500" />
              <h1 className="text-xl font-bold">LIVE TECH</h1>
            </div>
            <a href="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Retour à l'accueil
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl font-serif font-bold">Conditions Générales d'Utilisation (CGU)</h1>
            <p className="text-muted-foreground text-lg">
              Dernière mise à jour : 20 Février 2026
            </p>
          </div>

          {/* Alert */}
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">Important</p>
                <p className="text-sm text-amber-700">
                  En utilisant la plateforme LIVE TECH, vous acceptez sans réserve les présentes conditions. 
                  Veuillez les lire attentivement avant de créer votre compte.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Objet des CGU</h2>
              <p className="text-muted-foreground leading-relaxed">
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme 
                <strong> LIVE TECH</strong>, solution SaaS de gestion de conversations WhatsApp Business destinée aux 
                entreprises, services publics et organisations en Afrique francophone.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                En créant un compte sur LIVE TECH, vous (ci-après "le Client" ou "l'Utilisateur") acceptez sans réserve 
                les présentes CGU, qui constituent un contrat juridiquement contraignant entre vous et LIVE TECH.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Description du Service</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  LIVE TECH est une plateforme SaaS qui permet de :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Connecter et gérer un ou plusieurs numéros WhatsApp Business</li>
                  <li>Recevoir et envoyer des messages WhatsApp via l'API WhatsApp Business de Meta</li>
                  <li>Configurer des bots de conversation automatisés avec réponses par mots-clés</li>
                  <li>Gérer les conversations clients et les assigner à des agents humains</li>
                  <li>Suivre les performances via des tableaux de bord et statistiques</li>
                  <li>Gérer les accès et rôles des utilisateurs (admin, agent)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Le service est accessible via navigateur web (application web responsive) et ne nécessite aucun téléchargement.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Conditions d'Accès</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Pour accéder à LIVE TECH, vous devez :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Être majeur et avoir la capacité juridique de contracter</li>
                  <li>Agir pour le compte d'une entreprise ou organisation légalement constituée</li>
                  <li>Disposer d'un numéro WhatsApp Business valide (ou être en mesure d'en obtenir un)</li>
                  <li>Fournir des informations exactes et complètes lors de l'inscription</li>
                  <li>Maintenir la confidentialité de vos identifiants de connexion</li>
                  <li>Ne pas partager vos accès avec des tiers non autorisés</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  LIVE TECH se réserve le droit de refuser toute inscription ou de suspendre tout compte en cas de manquement 
                  à ces conditions.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Tarifs et Paiement</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">4.1. Plans et Tarifs</h3>
                <p className="text-muted-foreground leading-relaxed">
                  LIVE TECH propose plusieurs plans d'abonnement (voir grille tarifaire sur notre site) :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Plan Starter :</strong> 15 000 FCFA/mois - 1 numéro, 500 conversations, 2 agents</li>
                  <li><strong>Plan Business :</strong> 45 000 FCFA/mois - 3 numéros, 5 000 conversations, 10 agents</li>
                  <li><strong>Plan Enterprise :</strong> Sur mesure - illimité, fonctionnalités avancées</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Les tarifs sont exprimés en FCFA (Franc CFA) et s'entendent hors taxes. La TVA et autres taxes applicables 
                  seront ajoutées selon la réglementation en vigueur dans votre pays.
                </p>

                <h3 className="text-lg font-semibold pt-4">4.2. Modalités de Paiement</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les paiements sont effectués :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Par Mobile Money (Wave, Orange Money, Free Money, MTN MoMo, Moov Money)</li>
                  <li>Par virement bancaire (pour les plans Enterprise)</li>
                  <li>Facturation mensuelle ou annuelle (avec réduction pour engagement annuel)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Le paiement est exigible d'avance, au début de chaque période de facturation. En cas de retard de paiement, 
                  LIVE TECH se réserve le droit de suspendre l'accès au service après 7 jours de relance restée infructueuse.
                </p>

                <h3 className="text-lg font-semibold pt-4">4.3. Remboursements</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Conformément à la réglementation sur les services numériques, les abonnements aux services SaaS ne sont pas 
                  remboursables, sauf cas exceptionnel apprécié par LIVE TECH (dysfonctionnement majeur non résolu sous 72h).
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Engagement et Résiliation</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">5.1. Durée d'Engagement</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les abonnements sont souscrits pour une durée minimale d'un (1) mois, renouvelable par tacite reconduction. 
                  Vous pouvez résilier à tout moment sans frais, avec un préavis de 7 jours avant la fin de la période en cours.
                </p>

                <h3 className="text-lg font-semibold pt-4">5.2. Résiliation par le Client</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Pour résilier votre abonnement :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Connectez-vous à votre compte LIVE TECH</li>
                  <li>Accédez à la section "Paramètres" &gt; "Abonnement"</li>
                  <li>Cliquez sur "Résilier mon abonnement"</li>
                  <li>Confirmez votre demande de résiliation</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Ou contactez-nous directement à : <a href="mailto:contact@livepay.tech" className="text-green-500 hover:underline">contact@livepay.tech</a>
                </p>

                <h3 className="text-lg font-semibold pt-4">5.3. Résiliation par LIVE TECH</h3>
                <p className="text-muted-foreground leading-relaxed">
                  LIVE TECH peut résilier votre accès au service dans les cas suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Violation des présentes CGU ou de la politique de confidentialité</li>
                  <li>Utilisation frauduleuse ou illicite du service</li>
                  <li>Retard de paiement non régularisé sous 15 jours</li>
                  <li>Cessation d'activité de votre entreprise</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Sauf urgence, LIVE TECH vous notifiera la résiliation par email avec un préavis de 15 jours.
                </p>

                <h3 className="text-lg font-semibold pt-4">5.4. Conséquences de la Résiliation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  En cas de résiliation :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Votre accès au service sera coupé à la fin de la période payée</li>
                  <li>Vos données seront conservées pendant 30 jours (période de réversibilité)</li>
                  <li>Passé ce délai, vos données seront définitivement supprimées</li>
                  <li>Vous pouvez exporter vos données avant la suppression (portabilité)</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Obligations du Client</h2>
              <p className="text-muted-foreground leading-relaxed">
                En tant qu'utilisateur de LIVE TECH, vous vous engagez à :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>Utiliser le service conformément aux lois et règlements en vigueur</li>
                <li>Ne pas envoyer de messages spam, non sollicités ou à caractère commercial abusif</li>
                <li>Respecter les règles d'utilisation de WhatsApp Business API (politique Meta)</li>
                <li>Ne pas utiliser le service pour des activités illégales, frauduleuses ou nuisibles</li>
                <li>Ne pas tenter de contourner les mesures de sécurité ou de copier le service</li>
                <li>Ne pas revendre, sous-licencier ou louer l'accès au service à des tiers</li>
                <li>Informer immédiatement LIVE TECH en cas d'utilisation frauduleuse de votre compte</li>
                <li>Maintenir à jour vos informations de compte et de facturation</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                En cas de violation de ces obligations, LIVE TECH se réserve le droit de suspendre ou résilier votre accès 
                au service, sans préjudice des poursuites judiciaires éventuelles.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Propriété Intellectuelle</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  LIVE TECH reste seul et unique propriétaire de :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>La plateforme, du code source, des algorithmes et de l'architecture technique</li>
                  <li>Des logos, marques, noms commerciaux et éléments graphiques de LIVE TECH</li>
                  <li>Des documentations, guides, tutoriels et contenus pédagogiques</li>
                  <li>Des améliorations, modifications et évolutions apportées au service</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Le Client reste propriétaire de ses données (conversations, contacts, configurations). Toutefois, il accorde 
                  à LIVE TECH une licence d'utilisation limitée pour fournir et améliorer le service.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Toute reproduction, représentation ou utilisation non autorisée des éléments protégés de LIVE TECH constitue 
                  une contrefaçon passible de sanctions pénales et civiles.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Responsabilité et Garanties</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">8.1. Obligations de LIVE TECH</h3>
                <p className="text-muted-foreground leading-relaxed">
                  LIVE TECH s'engage à :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Fournir un service accessible 24h/24 et 7j/7, hors périodes de maintenance</li>
                  <li>Mettre en œuvre tous les moyens nécessaires pour assurer la qualité du service</li>
                  <li>Assurer un support technique réactif (email, téléphone) du lundi au vendredi, 9h-18h GMT</li>
                  <li>Protéger et sécuriser les données du Client conformément à la politique de confidentialité</li>
                  <li>Informer les Clients en cas de modification majeure ou d'interruption du service</li>
                </ul>

                <h3 className="text-lg font-semibold pt-4">8.2. Limitation de Responsabilité</h3>
                <p className="text-muted-foreground leading-relaxed">
                  La responsabilité de LIVE TECH ne saurait être engagée dans les cas suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Interruptions de service dues à des cas de force majeure (panne Internet, catastrophe naturelle, etc.)</li>
                  <li>Problèmes liés à l'API WhatsApp Business de Meta (hors du contrôle de LIVE TECH)</li>
                  <li>Mauvaise utilisation du service par le Client ou ses préposés</li>
                  <li>Pertes de données dues à une négligence du Client (non-export, non-sauvegarde)</li>
                  <li>Préjudices indirects (perte de chiffre d'affaires, de clients, de données, etc.)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  La responsabilité financière de LIVE TECH est limitée au montant des sommes versées par le Client au titre 
                  des 3 derniers mois d'abonnement précédant le sinistre.
                </p>

                <h3 className="text-lg font-semibold pt-4">8.3. Garanties</h3>
                <p className="text-muted-foreground leading-relaxed">
                  LIVE TECH garantit que :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Le service est conforme aux descriptions fournies sur le site</li>
                  <li>Le service est exempt de virus et logiciels malveillants au moment de sa mise à disposition</li>
                  <li>Les données du Client sont sauvegardées régulièrement et sécurisées</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  LIVE TECH ne garantit pas que le service sera ininterrompu, exempt d'erreurs ou totalement sécurisé.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Support et Maintenance</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">9.1. Support Technique</h3>
                <p className="text-muted-foreground leading-relaxed">
                  LIVE TECH propose un support technique inclus dans tous les abonnements :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Support email :</strong> réponse sous 24h ouvrées (contact@livepay.tech)</li>
                  <li><strong>Support téléphonique :</strong> aux heures de bureau (lun-ven, 9h-18h GMT)</li>
                  <li><strong>Centre d'aide :</strong> documentation, tutoriels, FAQ en ligne</li>
                  <li><strong>Webinaires :</strong> sessions de formation régulières (plans Business et Enterprise)</li>
                </ul>

                <h3 className="text-lg font-semibold pt-4">9.2. Maintenance et Évolutions</h3>
                <p className="text-muted-foreground leading-relaxed">
                  LIVE TECH assure :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>La maintenance corrective (correction des bugs et dysfonctionnements)</li>
                  <li>La maintenance évolutive (ajout de nouvelles fonctionnalités, améliorations)</li>
                  <li>La maintenance de sécurité (mises à jour, correctifs de sécurité)</li>
                </ul>
                <p className="text-muted-foreground leading-relaxed">
                  Les périodes de maintenance planifiée seront annoncées au moins 48h à l'avance. Les maintenances d'urgence 
                  (sécurité) peuvent être effectuées sans préavis.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Modification des CGU</h2>
              <p className="text-muted-foreground leading-relaxed">
                LIVE TECH se réserve le droit de modifier les présentes CGU à tout moment, notamment pour :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>S'adapter aux évolutions légales et réglementaires</li>
                <li>Améliorer le service ou ajouter de nouvelles fonctionnalités</li>
                <li>Modifier les tarifs (avec préavis d'1 mois)</li>
                <li>Répondre aux exigences des partenaires (Meta/WhatsApp, processeurs de paiement, etc.)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Les modifications seront notifiées par email et/ou via une notification sur la plateforme. Si vous n'acceptez 
                pas les nouvelles CGU, vous pouvez résilier votre abonnement avant leur entrée en vigueur. Passé ce délai, 
                votre utilisation du service vaut acceptation des nouvelles CGU.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Droit Applicable et Litiges</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">11.1. Droit Applicable</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les présentes CGU sont régies par le droit sénégalais. En cas de litige, les parties s'efforceront de 
                  trouver une solution amiable dans un délai de 30 jours.
                </p>

                <h3 className="text-lg font-semibold pt-4">11.2. Médiation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  En l'absence de résolution amiable, le litige pourra être soumis à un médiateur désigné d'un commun accord 
                  entre les parties, conformément aux dispositions du Code sénégalais des obligations civiles et commerciales.
                </p>

                <h3 className="text-lg font-semibold pt-4">11.3. Compétence Juridictionnelle</h3>
                <p className="text-muted-foreground leading-relaxed">
                  À défaut de médiation, tout litige relatif à l'interprétation ou à l'exécution des présentes CGU sera de 
                  la compétence exclusive des tribunaux de Dakar (Sénégal), nonobstant appel en garantie ou pluralité de 
                  défendeurs.
                </p>

                <h3 className="text-lg font-semibold pt-4">11.4. Langue</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les présentes CGU sont rédigées en langue française. En cas de traduction dans une autre langue, seule la 
                  version française fera foi en cas de divergence.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. Dispositions Diverses</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">12.1. Non-renonciation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Le fait pour LIVE TECH de ne pas se prévaloir d'un manquement à l'une des obligations du Client ne saurait 
                  être interprété comme une renonciation à se prévaloir ultérieurement de ce manquement.
                </p>

                <h3 className="text-lg font-semibold pt-4">12.2. Nullité Partielle</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Si l'une des clauses des présentes CGU est déclarée nulle ou inapplicable, cette nullité n'entraînera pas 
                  la nullité des autres clauses, qui continueront à produire leurs effets.
                </p>

                <h3 className="text-lg font-semibold pt-4">12.3. Cession</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Le Client ne peut céder ou transférer ses droits et obligations découlant des présentes CGU sans l'accord 
                  écrit préalable de LIVE TECH. LIVE TECH peut céder ses droits à un tiers en cas de restructuration, fusion 
                  ou cession d'actifs.
                </p>

                <h3 className="text-lg font-semibold pt-4">12.4. Intégralité</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les présentes CGU, conjointement avec la Politique de Confidentialité et tout document expressément référencé, 
                  constituent l'intégralité des accords entre les parties concernant l'objet des présentes et remplacent toute 
                  convention ou accord antérieur.
                </p>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">13. Contact</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute question relative aux présentes CGU, vous pouvez contacter LIVE TECH :
                </p>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-500" />
                      <a href="mailto:contact@livepay.tech" className="text-green-500 hover:underline font-medium">
                        contact@livepay.tech
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="text-muted-foreground">+221 XX XXX XX XX</span>
                    </div>
                    <div className="pt-2">
                      <p className="text-sm text-muted-foreground mb-2">Horaires du support :</p>
                      <p className="text-sm text-muted-foreground">Lundi - Vendredi : 9h00 - 18h00 (GMT)</p>
                      <p className="text-sm text-muted-foreground">Week-end et jours fériés : Fermé</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Acceptance */}
            <Card className="border-green-300 bg-green-50">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-800">Acceptation des CGU</p>
                    <p className="text-sm text-green-700">
                      En utilisant la plateforme LIVE TECH, vous reconnaissez avoir lu, compris et accepté sans réserve 
                      les présentes Conditions Générales d'Utilisation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Footer note */}
          <Separator className="my-8" />
          <p className="text-center text-sm text-muted-foreground">
            © 2026 LIVE TECH. Tous droits réservés. | 
            <a href="/privacy" className="hover:text-foreground mx-2">Confidentialité</a> | 
            <a href="/terms" className="hover:text-foreground mx-2">CGU</a> | 
            <a href="/contact" className="hover:text-foreground mx-2">Contact</a>
          </p>
        </div>
      </main>
    </div>
  );
}
