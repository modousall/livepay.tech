import { FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Conditions de service</h1>
            <p className="text-sm text-muted-foreground">Derniere mise a jour: 20 fevrier 2026</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Champ d'application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              LivePay est une plateforme de gestion conversationnelle pour entites commerciales et services.
              En utilisant la plateforme, vous acceptez les presentes conditions.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comptes et responsabilites</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Vous etes responsable des informations fournies, de la securite de vos acces et de la conformite
              de vos activites avec les lois applicables.
            </p>
            <p>
              L'utilisation de WhatsApp, des services de paiement et des integrations externes doit respecter
              leurs regles respectives.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paiements et facturation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Les plans et couts associes sont disponibles dans l'interface. Toute consommation additionnelle
              peut entrainer une facturation supplementaire selon votre abonnement.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limitation de responsabilite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              LivePay fournit le service "en l'etat". Nous ne sommes pas responsables des interruptions
              liees a des fournisseurs tiers (WhatsApp, operateurs, plateformes de paiement).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
