import { ShieldCheck, Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-green-500" />
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
            <h1 className="text-4xl font-serif font-bold">Politique de Confidentialité</h1>
            <p className="text-muted-foreground text-lg">
              Dernière mise à jour : 20 Février 2026
            </p>
          </div>

          {/* Introduction */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <p className="text-muted-foreground">
                Chez <strong>LIVE TECH</strong>, nous accordons une importance primordiale à la protection de vos données personnelles. 
                Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos informations dans le 
                cadre de notre plateforme SaaS de gestion de conversations WhatsApp Business.
              </p>
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-sm text-muted-foreground">contact@livetech.africa</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold">Téléphone</p>
                    <p className="text-sm text-muted-foreground">+221 XX XXX XX XX</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold">Siège</p>
                    <p className="text-sm text-muted-foreground">Dakar, Sénégal</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-semibold">Support</p>
                    <p className="text-sm text-muted-foreground">Lun-Ven, 9h-18h GMT</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sections */}
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Responsable du Traitement</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le responsable du traitement des données est <strong>LIVE TECH</strong>, société de droit sénégalais, 
                spécialisée dans les solutions SaaS de communication WhatsApp Business pour les entreprises et services publics 
                en Afrique francophone.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Données Collectées</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">Nous collectons les données suivantes :</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li><strong>Données de compte :</strong> nom, prénom, email, mot de passe (crypté), rôle dans l'organisation</li>
                  <li><strong>Données d'entreprise :</strong> nom de l'organisation, secteur d'activité, numéro WhatsApp Business, adresse</li>
                  <li><strong>Données de conversation :</strong> messages WhatsApp échangés, contacts clients, historiques de conversation</li>
                  <li><strong>Données techniques :</strong> adresse IP, logs de connexion, navigateur, appareil utilisé</li>
                  <li><strong>Données de paiement :</strong> informations de facturation, historique des transactions (traitées par nos partenaires sécurisés)</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Finalités du Traitement</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">Vos données sont utilisées pour :</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Fournir et maintenir notre plateforme de gestion de conversations WhatsApp</li>
                  <li>Gérer votre compte client et votre abonnement</li>
                  <li>Assurer le support technique et la relation client</li>
                  <li>Améliorer nos services et développer de nouvelles fonctionnalités</li>
                  <li>Respecter nos obligations légales et réglementaires</li>
                  <li>Prévenir la fraude et assurer la sécurité de nos systèmes</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. Base Légale du Traitement</h2>
              <p className="text-muted-foreground leading-relaxed">
                Le traitement de vos données repose sur les bases légales suivantes :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Exécution du contrat :</strong> pour fournir nos services conformément à nos Conditions Générales d'Utilisation</li>
                <li><strong>Consentement :</strong> pour les communications marketing (que vous pouvez retirer à tout moment)</li>
                <li><strong>Obligation légale :</strong> pour respecter la réglementation en vigueur (facturation, conservation des données)</li>
                <li><strong>Intérêt légitime :</strong> pour améliorer nos services et assurer leur sécurité</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Durée de Conservation</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Nous conservons vos données selon les durées suivantes :
                </p>
                <div className="grid gap-3">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="font-semibold">Données de compte</p>
                    <p className="text-sm text-muted-foreground">Durée de l'abonnement + 3 ans (prescription commerciale)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="font-semibold">Conversations WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Selon votre plan (1 à 12 mois), puis suppression automatique</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="font-semibold">Données de facturation</p>
                    <p className="text-sm text-muted-foreground">10 ans (obligation légale comptable)</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="font-semibold">Logs de connexion</p>
                    <p className="text-sm text-muted-foreground">12 mois (sécurité et prévention fraude)</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Destinataires des Données</h2>
              <p className="text-muted-foreground leading-relaxed">
                Vos données peuvent être transmises aux catégories de destinataires suivantes :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Personnel autorisé LIVE TECH :</strong> équipes techniques, support client, administration</li>
                <li><strong>Sous-traitants techniques :</strong> hébergeurs cloud (Firebase/Google Cloud), services d'emailing</li>
                <li><strong>Partenaires de paiement :</strong> processeurs de paiement sécurisés (Wave, Orange Money, etc.)</li>
                <li><strong>Méta Platforms Inc. :</strong> pour l'intégration WhatsApp Business API (données de conversation)</li>
                <li><strong>Autorités légales :</strong> uniquement sur réquisition judiciaire ou obligation réglementaire</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Transfert Hors UE/EEE</h2>
              <p className="text-muted-foreground leading-relaxed">
                Certaines de vos données peuvent être transférées en dehors de l'Union Européenne, notamment vers :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>États-Unis :</strong> serveurs cloud (Google/Firebase) - garanties : Privacy Shield / Clauses Contractuelles Types</li>
                <li><strong>Sénégal :</strong> siège de LIVE TECH - garanties : adéquation décision UE</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Ces transferts sont encadrés par des garanties appropriées (Clauses Contractuelles Types de la Commission Européenne).
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Sécurité des Données</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Cryptage :</strong> données chiffrées en transit (TLS/SSL) et au repos (AES-256)</li>
                <li><strong>Contrôle d'accès :</strong> authentification forte, gestion des rôles et permissions</li>
                <li><strong>Sauvegardes :</strong> backups réguliers et sécurisés de vos données</li>
                <li><strong>Monitoring :</strong> surveillance continue pour détecter les intrusions et anomalies</li>
                <li><strong>Formation :</strong> notre personnel est formé à la protection des données personnelles</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Vos Droits</h2>
              <p className="text-muted-foreground leading-relaxed">
                Conformément au RGPD et à la loi sénégalaise sur la protection des données, vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
                <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données (sous conditions)</li>
                <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
                <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement pour motif légitime</li>
                <li><strong>Droit de retirer votre consentement :</strong> à tout moment pour les traitements basés sur le consentement</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@livetech.africa" className="text-green-500 hover:underline">contact@livetech.africa</a>
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Cookies et Traceurs</h2>
              <p className="text-muted-foreground leading-relaxed">
                Notre site utilise les technologies suivantes :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site (connexion, session)</li>
                <li><strong>Cookies de performance :</strong> analytics anonymisés pour améliorer nos services</li>
                <li><strong>Stockage local :</strong> pour la mise en cache et l'expérience utilisateur (PWA)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed">
                Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines fonctionnalités pourraient ne plus être disponibles.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Modification de la Politique</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
                Les changements significatifs vous seront notifiés par email et/ou via une notification sur notre plateforme. 
                Nous vous encourageons à consulter régulièrement cette page.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. Contact et Réclamation</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  Pour toute question relative à cette politique ou à l'exercice de vos droits, contactez notre équipe :
                </p>
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-green-500" />
                      <a href="mailto:contact@livetech.africa" className="text-green-500 hover:underline font-medium">contact@livetech.africa</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-500" />
                      <span className="text-muted-foreground">+221 XX XXX XX XX</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-500" />
                      <span className="text-muted-foreground">Dakar, Sénégal</span>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-muted-foreground leading-relaxed">
                  Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de la 
                  <strong> Commission Sénégalaise de Protection des Données Personnelles (CDP)</strong> ou de l'autorité 
                  de protection de votre pays de résidence.
                </p>
              </div>
            </section>
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
