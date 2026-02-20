import {
  MessageCircle,
  Shield,
  CreditCard,
  ArrowRight,
  Sparkles,
  CheckCircle,
  CalendarClock,
  Ticket,
  UsersRound,
  BarChart3,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Chatbot WhatsApp 24/7",
    desc: "Une entree unique client pour commandes, tickets, Agenda et file d'attente.",
    tone: "text-green-600 bg-green-500/10",
  },
  {
    icon: CreditCard,
    title: "Paiement Mobile Money",
    desc: "Wave, Orange Money, Free Money avec confirmations automatiques.",
    tone: "text-blue-600 bg-blue-500/10",
  },
  {
    icon: Ticket,
    title: "Billetterie & E-ticket",
    desc: "Recu/e-ticket genere et partage instantanement au client.",
    tone: "text-indigo-600 bg-indigo-500/10",
  },
  {
    icon: CalendarClock,
    title: "Agenda services",
    desc: "Gestion des creneaux pour hopitaux, administrations, prestataires.",
    tone: "text-orange-600 bg-orange-500/10",
  },
  {
    icon: UsersRound,
    title: "File d'attente numerique",
    desc: "Ticket file, priorites, estimation d'attente et appel intelligent.",
    tone: "text-fuchsia-600 bg-fuchsia-500/10",
  },
  {
    icon: BarChart3,
    title: "Pilotage metier",
    desc: "Tableau de bord adapte au profil et suivi de performance en temps reel.",
    tone: "text-emerald-600 bg-emerald-500/10",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-green-500 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LivePay</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <a href="/login">
              <Button data-testid="button-login">Se connecter</Button>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-1 text-sm text-green-600">
                <Sparkles className="w-3 h-3" />
                Platforme conversationnelle multi-metiers
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-tight">
                Un seul hub pour
                <br />
                <span className="text-green-500">vendre et servir</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                E-commerce, billetterie evenementielle, Agenda services publics
                et file d'attente numerique unifies dans la meme plateforme.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="/register">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600" data-testid="button-get-started">
                    Activer ma plateforme
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <a href="/login">
                  <Button size="lg" variant="outline" data-testid="button-login-hero">
                    Se connecter
                  </Button>
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-500" /> Exploitation securisee</span>
                <span className="flex items-center gap-1"><CreditCard className="w-3 h-3 text-green-500" /> Paiement mobile money</span>
                <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-green-500" /> Livraison et suivi</span>
              </div>
            </div>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  Orchestrateur WhatsApp
                </h3>
                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Actif 24/24
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  Client: "RDV CARDIO"
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  Bot: "Creneaux proposes + lien confirmation"
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  Bot: "Paiement confirme + recu e-ticket + suivi"
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 text-green-700 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Workflow complet automatise
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold">Modules plateformes</h2>
            <p className="text-muted-foreground mt-2">Concu pour plusieurs secteurs d'activite</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((item) => (
              <Card key={item.title} className="p-6 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center mb-4 ${item.tone}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>\n</div>
  );
}




