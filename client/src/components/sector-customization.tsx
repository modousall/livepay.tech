/**
 * Composant de personnalisation par secteur métier
 * Affiche les fonctionnalités et modules spécifiques au secteur
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Landmark as Bank, 
  Shield, 
  Smartphone, 
  Zap, 
  Heart, 
  Car, 
  GraduationCap,
  Plane,
  Home,
  Wrench,
  Calendar,
  Users,
  CheckCircle2
} from "lucide-react";

interface SectorCard {
  key: string;
  label: string;
  description: string;
  icon: string;
  color: string;
  features: string[];
  modules: string[];
}

const SECTORS: SectorCard[] = [
  {
    key: "banking_microfinance",
    label: "Banque / Microfinance",
    description: "Services financiers, crédits, épargne",
    icon: "bank",
    color: "blue",
    features: [
      "Gestion des comptes clients",
      "Demandes de crédit en ligne",
      "Suivi des dossiers",
      "Réclamations",
      "Tickets de caisse",
    ],
    modules: ["crm_backoffice", "appointments", "queue_management", "products"],
  },
  {
    key: "insurance",
    label: "Assurance",
    description: "Polices, sinistres, cotisations",
    icon: "shield",
    color: "green",
    features: [
      "Déclaration de sinistres",
      "Suivi des polices",
      "Paiement des primes",
      "Gestion des bénéficiaires",
      "Expertise en ligne",
    ],
    modules: ["crm_backoffice", "interventions", "appointments", "products"],
  },
  {
    key: "telecom",
    label: "Télécom",
    description: "Forfaits, consommation, recharges",
    icon: "smartphone",
    color: "purple",
    features: [
      "Suivi de consommation",
      "Recharges en ligne",
      "Forfaits data/voice/SMS",
      "Signalement d'incidents",
      "Support technique",
    ],
    modules: ["crm_backoffice", "interventions", "queue_management", "products", "orders"],
  },
  {
    key: "utilities",
    label: "Énergie / Eau",
    description: "Factures, relevés, interventions",
    icon: "zap",
    color: "yellow",
    features: [
      "Suivi des factures",
      "Relevés de compteur",
      "Signalement de pannes",
      "Interventions techniques",
      "Alertes de coupure",
    ],
    modules: ["crm_backoffice", "interventions", "queue_management", "products"],
  },
  {
    key: "healthcare_private",
    label: "Santé Privée",
    description: "Rendez-vous, consultations, dossiers",
    icon: "heart",
    color: "red",
    features: [
      "Prise de rendez-vous",
      "Dossiers patients",
      "Ordonnances en ligne",
      "Téléconsultation",
      "Rappels de vaccination",
    ],
    modules: ["appointments", "crm_backoffice", "products"],
  },
  {
    key: "transport",
    label: "Transport",
    description: "Réservations, horaires, bagages",
    icon: "car",
    color: "orange",
    features: [
      "Réservation de places",
      "Horaires en temps réel",
      "Suivi de bagages",
      "Billets électroniques",
      "Alertes de retard",
    ],
    modules: ["queue_management", "ticketing", "products"],
  },
  {
    key: "education",
    label: "Éducation / Formation",
    description: "Inscriptions, cours, emplois du temps",
    icon: "graduation-cap",
    color: "indigo",
    features: [
      "Inscriptions en ligne",
      "Emplois du temps",
      "Notes et bulletins",
      "Paiement des frais",
      "Communication parents",
    ],
    modules: ["appointments", "products", "ticketing"],
  },
  {
    key: "rental",
    label: "Location de Biens",
    description: "Réservations, états des lieux, contrats",
    icon: "home",
    color: "teal",
    features: [
      "Réservation en ligne",
      "États des lieux",
      "Contrats électroniques",
      "Paiement des loyers",
      "Gestion des cautions",
    ],
    modules: ["products", "orders", "appointments"],
  },
  {
    key: "field_services",
    label: "Services à Domicile",
    description: "Interventions, devis, facturation",
    icon: "wrench",
    color: "cyan",
    features: [
      "Demande d'intervention",
      "Devis en ligne",
      "Suivi de technicien",
      "Facturation",
      "Évaluation du service",
    ],
    modules: ["interventions", "crm_backoffice"],
  },
  {
    key: "events",
    label: "Événementiel",
    description: "Billetterie, places, accès",
    icon: "calendar",
    color: "pink",
    features: [
      "Vente de billets",
      "Places numérotées",
      "Contrôle d'accès",
      "Statistiques de vente",
      "Remboursements",
    ],
    modules: ["ticketing", "products"],
  },
  {
    key: "shop",
    label: "Boutique / E-commerce",
    description: "Vente de produits, commandes, livraisons",
    icon: "building2",
    color: "slate",
    features: [
      "Catalogue produits",
      "Panier et commandes",
      "Suivi de livraison",
      "Fidélisation clients",
      "Promotions",
    ],
    modules: ["products", "orders", "crm_backoffice"],
  },
];

const ICON_MAP: Record<string, any> = {
  bank: Bank,
  shield: Shield,
  smartphone: Smartphone,
  zap: Zap,
  heart: Heart,
  car: Car,
  graduationCap: GraduationCap,
  home: Home,
  wrench: Wrench,
  calendar: Calendar,
  users: Users,
  building2: Building2,
  plane: Plane,
};

interface SectorSelectionProps {
  onSelectSector: (sector: string) => void;
  currentSector?: string;
}

export function SectorSelection({ onSelectSector, currentSector }: SectorSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choisissez votre secteur d'activité</h2>
        <p className="text-muted-foreground">
          Personnalisez votre expérience LivePay selon votre métier
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SECTORS.map((sector) => {
          const Icon = ICON_MAP[sector.icon] || Building2;
          const isSelected = currentSector === sector.key;

          return (
            <Card
              key={sector.key}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? "border-primary ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelectSector(sector.key)}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${sector.color}-100 dark:bg-${sector.color}-900/30`}>
                    <Icon className={`h-6 w-6 text-${sector.color}-600`} />
                  </div>
                  <CardTitle className="text-lg">{sector.label}</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {sector.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Fonctionnalités :</h4>
                  <ul className="space-y-1">
                    {sector.features.slice(0, 4).map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                        {feature}
                      </li>
                    ))}
                    {sector.features.length > 4 && (
                      <li className="text-xs text-muted-foreground">
                        +{sector.features.length - 4} autres...
                      </li>
                    )}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-1">
                  {sector.modules.slice(0, 3).map((module) => (
                    <Badge key={module} variant="secondary" className="text-xs">
                      {module.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>

                <Button
                  className={`w-full ${isSelected ? "bg-primary" : ""}`}
                  variant={isSelected ? "default" : "outline"}
                >
                  {isSelected ? "Secteur actuel" : "Sélectionner"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Hook pour obtenir les paramètres d'interface par secteur
 */
export function useSectorCustomization(segment: string) {
  const customization: Record<string, any> = {
    banking_microfinance: {
      themeColor: "blue",
      dashboardWidgets: ["accounts", "loans", "transactions", "crm"],
      quickActions: ["new_account", "loan_request", "transfer", "complaint"],
      menuItems: ["accounts", "loans", "transactions", "clients", "reports"],
    },
    insurance: {
      themeColor: "green",
      dashboardWidgets: ["policies", "claims", "premiums", "crm"],
      quickActions: ["new_policy", "report_claim", "pay_premium", "complaint"],
      menuItems: ["policies", "claims", "premiums", "clients", "reports"],
    },
    telecom: {
      themeColor: "purple",
      dashboardWidgets: ["subscriptions", "usage", "topups", "incidents"],
      quickActions: ["new_subscription", "topup", "report_incident", "change_plan"],
      menuItems: ["subscriptions", "usage", "topups", "plans", "incidents"],
    },
    utilities: {
      themeColor: "yellow",
      dashboardWidgets: ["meters", "bills", "readings", "interventions"],
      quickActions: ["new_meter", "report_reading", "pay_bill", "report_outage"],
      menuItems: ["meters", "bills", "readings", "interventions", "clients"],
    },
    healthcare_private: {
      themeColor: "red",
      dashboardWidgets: ["appointments", "patients", "consultations"],
      quickActions: ["new_appointment", "new_patient", "prescription", "emergency"],
      menuItems: ["appointments", "patients", "consultations", "prescriptions"],
    },
    transport: {
      themeColor: "orange",
      dashboardWidgets: ["reservations", "schedules", "tracking"],
      quickActions: ["new_reservation", "check_schedule", "track_baggage"],
      menuItems: ["reservations", "schedules", "tracking", "tickets"],
    },
    education: {
      themeColor: "indigo",
      dashboardWidgets: ["enrollments", "schedules", "grades"],
      quickActions: ["new_enrollment", "view_schedule", "enter_grades"],
      menuItems: ["enrollments", "schedules", "grades", "students"],
    },
    rental: {
      themeColor: "teal",
      dashboardWidgets: ["properties", "bookings", "contracts"],
      quickActions: ["new_booking", "view_property", "create_contract"],
      menuItems: ["properties", "bookings", "contracts", "payments"],
    },
    field_services: {
      themeColor: "cyan",
      dashboardWidgets: ["interventions", "technicians", "quotes"],
      quickActions: ["new_intervention", "assign_technician", "create_quote"],
      menuItems: ["interventions", "technicians", "quotes", "invoices"],
    },
    events: {
      themeColor: "pink",
      dashboardWidgets: ["events", "tickets", "sales"],
      quickActions: ["new_event", "sell_ticket", "view_sales"],
      menuItems: ["events", "tickets", "sales", "attendees"],
    },
    shop: {
      themeColor: "slate",
      dashboardWidgets: ["products", "orders", "revenue", "clients"],
      quickActions: ["new_product", "new_order", "view_revenue"],
      menuItems: ["products", "orders", "clients", "reports"],
    },
  };

  return customization[segment] || customization.shop;
}

/**
 * Composant qui affiche les widgets personnalisés selon le secteur
 */
export function SectorWidgets({ segment }: { segment: string }) {
  const { dashboardWidgets } = useSectorCustomization(segment);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {dashboardWidgets.map((widget: string) => (
        <Card key={widget}>
          <CardHeader>
            <CardTitle className="text-sm capitalize">{widget.replace(/_/g, " ")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">--</p>
            <p className="text-xs text-muted-foreground">En attente de données</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
