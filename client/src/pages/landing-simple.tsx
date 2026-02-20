import { MessageCircle, Bot, BarChart3, Shield, CheckCircle, ArrowRight, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "/logo.jpg";

const FEATURES = [
  {
    icon: MessageCircle,
    title: "Conversations WhatsApp",
    desc: "Gérez toutes vos conversations clients dans une interface unifiée.",
    tone: "text-green-600 bg-green-500/10",
  },
  {
    icon: Bot,
    title: "Bot Intelligent",
    desc: "Réponses automatiques configurables sans code avec triggers par mots-clés.",
    tone: "text-blue-600 bg-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "Statistiques Temps Réel",
    desc: "Suivez les performances: temps de réponse, taux d'escalade, satisfaction.",
    tone: "text-indigo-600 bg-indigo-500/10",
  },
  {
    icon: Users,
    title: "Gestion des Agents",
    desc: "Assignez les conversations et escaladez vers les agents humains.",
    tone: "text-orange-600 bg-orange-500/10",
  },
];

const USE_CASES = [
  { icon: Zap, name: "Services Publics", desc: "Réponses aux citoyens 24/7" },
  { icon: MessageCircle, name: "Entreprises", desc: "Support client automatisé" },
  { icon: CheckCircle, name: "E-commerce", desc: "Commandes et suivi WhatsApp" },
];

const PRICING_PLANS = [
  {
    name: "Starter",
    price: "15 000",
    period: "FCFA/mois",
    description: "Pour les petites structures",
    features: [
      "1 numéro WhatsApp",
      "500 conversations/mois",
      "Bot basique (5 scénarios)",
      "2 agents",
      "Statistiques de base",
      "Support email",
    ],
    cta: "Demander un accès",
    popular: false,
  },
  {
    name: "Business",
    price: "45 000",
    period: "FCFA/mois",
    description: "Pour les entreprises en croissance",
    features: [
      "3 numéros WhatsApp",
      "5 000 conversations/mois",
      "Bot intelligent (illimité)",
      "10 agents",
      "Statistiques avancées",
      "Escalade automatique",
      "Support prioritaire",
    ],
    cta: "Demander un accès",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Sur mesure",
    period: "",
    description: "Pour les grandes organisations",
    features: [
      "Numéros illimités",
      "Conversations illimitées",
      "Bot personnalisé",
      "Agents illimités",
      "API dédiée",
      "SLA garanti",
      "Account manager",
    ],
    cta: "Nous contacter",
    popular: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={Logo} alt="LIVE TECH Logo" className="w-10 h-10 rounded-md object-cover" />
            <span className="text-lg font-semibold tracking-tight">LIVE TECH</span>
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
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-1 text-sm text-green-600">
                <Bot className="w-3 h-3" />
                Plateforme SaaS B2B WhatsApp
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight leading-tight">
                Digitalisez votre
                <br />
                <span className="text-green-500">relation client</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Une plateforme unifiée pour automatiser et gérer vos conversations
                WhatsApp avec vos clients. Bot intelligent, escalade humaine et
                statistiques en temps réel.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href="/login">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600" data-testid="button-request-access">
                    Se connecter
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </a>
                <a href="mailto:contact@livepay.tech?subject=Demande%20de%20d%C3%A9mo%20LIVE%20TECH">
                  <Button size="lg" variant="outline">
                    Contacter pour démo
                  </Button>
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                💡 Accès sur invitation uniquement. Contactez-nous pour activer votre compte.
              </p>
            </div>

            <Card className="p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-500" />
                  Conversation WhatsApp
                </h3>
                <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  En direct
                </span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p>Bonjour, je voudrais des informations sur vos services</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-muted-foreground">Bot (Auto)</p>
                  <p>Bonjour! Je suis votre assistant virtuel. Comment puis-je vous aider?</p>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p>Je veux ouvrir un compte</p>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-md bg-green-500/10 text-green-700 text-xs">
                  <CheckCircle className="w-3 h-3" />
                  Bot: Trigger "ouvrir compte" détecté → Escalade agent
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold">Cas d'usage</h2>
            <p className="text-muted-foreground mt-2">Adapté à votre secteur d'activité</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {USE_CASES.map((useCase) => (
              <Card key={useCase.name} className="p-6 text-center hover:shadow-md transition-shadow">
                <useCase.icon className="w-10 h-10 mx-auto mb-3 text-green-500" />
                <h3 className="font-semibold text-base mb-1">{useCase.name}</h3>
                <p className="text-sm text-muted-foreground">{useCase.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-serif font-bold">Fonctionnalités clés</h2>
            <p className="text-muted-foreground mt-2">Tout ce dont vous avez besoin pour gérer vos conversations</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((item) => (
              <Card key={item.title} className="p-6 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-md flex items-center justify-center mb-4 ${item.tone}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-6xl mx-auto px-4 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-1 text-sm text-green-600 mb-4">
              <Zap className="w-3 h-3" />
              Tarification simple et transparente
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold">Nos offres</h2>
            <p className="text-muted-foreground mt-2">Choisissez le plan adapté à votre structure</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {PRICING_PLANS.map((plan) => (
              <Card
                key={plan.name}
                className={`p-6 hover:shadow-lg transition-shadow relative ${
                  plan.popular ? "border-green-500 border-2 shadow-lg" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    Populaire
                  </div>
                )}
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a href="mailto:contact@livepay.tech?subject=Demander%20accès%20LIVE%20TECH">
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </a>
                  {plan.name !== "Enterprise" && (
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      💡 Contactez-nous pour activer votre essai
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8 text-sm text-muted-foreground">
            <p>💡 Tous les plans incluent:</p>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Sécurité maximale</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Mises à jour incluses</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Support WhatsApp</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Bande fine avec copyright et liens */}
      <footer className="border-t py-4 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>&copy; 2026 LIVE TECH. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-foreground transition-colors">Politique de confidentialité</a>
              <span className="text-muted-foreground/50">•</span>
              <a href="/terms" className="hover:text-foreground transition-colors">CGU</a>
              <span className="text-muted-foreground/50">•</span>
              <a href="mailto:contact@livepay.tech" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
