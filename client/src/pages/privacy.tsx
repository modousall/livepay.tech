import { ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-emerald-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Politique de confidentialite</h1>
            <p className="text-sm text-muted-foreground">Derniere mise a jour: 20 fevrier 2026</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Donnees collectees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Nous collectons les informations necessaires au fonctionnement de la plateforme: identite,
              coordonnees, informations de facturation, catalogues, commandes, interactions clients et
              journaux techniques.
            </p>
            <p>
              Les messages WhatsApp sont traites pour executer vos workflows et fournir le service.
              Les donnees sensibles sont limitees au strict necessaire.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Utilisation des donnees</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Les donnees servent a fournir les modules (catalogue, ventes, CRM, billetterie, files
              d'attente, rendez-vous) et a personnaliser l'experience selon votre profil.
            </p>
            <p>
              Nous n'utilisons pas vos donnees a des fins publicitaires externes sans consentement explicite.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partage et securite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Les donnees sont hebergees sur Firebase/Google Cloud. Nous appliquons des controles d'acces
              par roles, des journaux d'audit et des bonnes pratiques de securite.
            </p>
            <p>
              Le partage avec des tiers est limite aux services indispensables (paiement, messagerie, hebergement).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vos droits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Vous pouvez demander la consultation, la rectification ou la suppression de vos donnees.
              Pour cela, contactez l'equipe LivePay via votre espace ou le canal support.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
