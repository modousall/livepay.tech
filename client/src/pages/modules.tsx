import { useEffect, useState } from "react";
import { Link } from "wouter";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { getVendorConfig, type VendorConfig } from "@/lib/firebase";
import { BUSINESS_PROFILES, PERSONA_MODULES, type BusinessProfileKey } from "@/lib/business-profiles";


const INNOVATION_PACKS = [
  {
    title: "Copilote IA de qualification",
    description: "Qualification automatique des demandes clients et routage vers le bon workflow metier.",
    status: "Roadmap",
  },
  {
    title: "Moteur SLA & priorites",
    description: "Priorisation intelligente selon urgence, valeur client et temps d'attente.",
    status: "Roadmap",
  },
  {
    title: "Orchestration omnicanale",
    description: "Continuite WhatsApp, web et points physiques avec historique unifie.",
    status: "Roadmap",
  },
];

const CRM_VERTICALS = [
  {
    name: "Banque / Microfinance",
    workflows: ["Reclamation compte", "Info produit credit", "Suivi dossier pret"],
  },
  {
    name: "Assurance",
    workflows: ["Declaration sinistre", "Suivi police", "Escalade gestionnaire"],
  },
  {
    name: "Telecom",
    workflows: ["Incident reseau", "Assistance forfait", "Reclamation SAV"],
  },
  {
    name: "Energie / Eau",
    workflows: ["Signalement panne", "Info facturation", "Suivi intervention"],
  },
  {
    name: "Sante privee",
    workflows: ["Orientation patient", "Prise RDV", "Rappels suivi"],
  },
  {
    name: "Administration / Service public",
    workflows: ["RDV guichet", "File d'attente", "Suivi demande citoyen"],
  },
];

const BUSINESS_PLANS = [
  { name: "Starter", price: "7 500 FCFA/mois", fit: "petites structures", cap: "1 000 conversations incluses" },
  { name: "Growth", price: "25 000 FCFA/mois", fit: "PME / reseaux", cap: "5 000 conversations + CRM SLA" },
  { name: "Scale", price: "90 000 FCFA/mois", fit: "banques / multi-sites", cap: "20 000 conversations + gouvernance" },
];

export default function ModulesPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<VendorConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const cfg = await getVendorConfig(user.id);
        setConfig(cfg);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [user]);

  const profileKey = (config?.segment as BusinessProfileKey) || "shop";
  const profile = BUSINESS_PROFILES[profileKey];
  const isExpertMode = (config?.uiMode || "simplified") === "expert";
  const moduleIds = isExpertMode
    ? (Object.keys(PERSONA_MODULES) as Array<keyof typeof PERSONA_MODULES>)
    : profile.essentialModules;
  const essentialModules = moduleIds.map((moduleId) => PERSONA_MODULES[moduleId]);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Modules metier</h1>
        <p className="text-muted-foreground">
          Configuration et evolution de votre plateforme selon votre secteur.
        </p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
        </div>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Profil actif: {profile.label}</span>
                <div className="flex items-center gap-2">
                  <Badge>{profileKey}</Badge>
                  <Badge variant={isExpertMode ? "default" : "secondary"}>
                    {isExpertMode ? "mode expert" : "mode simplifie"}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{profile.botHint}</p>
              <div className="grid md:grid-cols-3 gap-3">
                {profile.highlights.map((item) => (
                  <div key={item} className="rounded-lg border p-3 text-sm bg-muted/20">
                    {item}
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-3 gap-3 pt-2">
                <Link href="/settings">
                  <Button className="w-full">Changer profil / mode</Button>
                </Link>
                <Link href="/modules/crm-backoffice">
                  <Button className="w-full" variant="outline">Ouvrir CRM</Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="w-full" variant="outline">Control tower</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Innovations a activer</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              {INNOVATION_PACKS.map((pack) => (
                <div key={pack.title} className="rounded-xl border p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{pack.title}</p>
                    <Badge variant="secondary">{pack.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{pack.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parcours essentiels ({profile.label})</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              {essentialModules.map((module) => (
                <div key={module.title} className="rounded-xl border p-4 space-y-3">
                  <div>
                    <p className="font-medium">{module.title}</p>
                    <p className="text-sm text-muted-foreground">{module.desc}</p>
                  </div>
                  <Link href={module.path}>
                    <Button variant="outline" size="sm">Ouvrir</Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Playbooks CRM par secteur</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CRM_VERTICALS.map((vertical) => (
                <div key={vertical.name} className="rounded-xl border p-4 space-y-2">
                  <p className="font-medium">{vertical.name}</p>
                  <div className="space-y-1">
                    {vertical.workflows.map((wf) => (
                      <p key={wf} className="text-sm text-muted-foreground">- {wf}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business model recommande</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4">
              {BUSINESS_PLANS.map((plan) => (
                <div key={plan.name} className="rounded-xl border p-4 space-y-2 bg-gradient-to-b from-muted/20 to-background">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{plan.name}</p>
                    <Badge variant="outline">{plan.fit}</Badge>
                  </div>
                  <p className="text-lg font-bold">{plan.price}</p>
                  <p className="text-sm text-muted-foreground">{plan.cap}</p>
                </div>
              ))}
              <div className="md:col-span-3 rounded-xl border p-4 bg-green-50 dark:bg-green-950/20">
                <p className="text-sm">
                  Recommandation UX commerciale: commencer sur <strong>Starter</strong>, activer l'alerte de depassement,
                  puis proposer auto-upgrade vers <strong>Growth</strong> quand l'usage depasse 70% du quota.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
