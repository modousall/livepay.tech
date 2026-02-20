import { Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-rose-500/10 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Suppression des donnees utilisateur</h1>
            <p className="text-sm text-muted-foreground">Procedure officielle LivePay</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Demander la suppression</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Pour supprimer vos donnees, merci d'utiliser le canal support officiel depuis votre compte
              ou d'envoyer une demande ecrite avec:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nom de l'entite / compte</li>
              <li>Email principal utilise</li>
              <li>Numero WhatsApp associe</li>
              <li>Motif de suppression (optionnel)</li>
            </ul>
            <p>
              Un accusé de reception vous sera transmis et la suppression sera effectuee sous 30 jours.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Impact de la suppression</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              La suppression entraine la perte definitive des catalogues, commandes, tickets, statistiques
              et historiques CRM. Les factures reglementaires peuvent etre conservees selon les obligations legales.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>
              Si vous ne pouvez plus acceder a votre compte, contactez le support pour verification d'identite.
            </p>
            <Button variant="outline" className="w-fit">
              Ouvrir le support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
