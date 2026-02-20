export type BusinessProfileKey =
  | "shop"
  | "events"
  | "appointments"
  | "queue_management"
  | "banking_microfinance"
  | "insurance"
  | "telecom"
  | "utilities"
  | "education"
  | "transport"
  | "field_services"
  | "rental"
  | "healthcare_private";

export interface BusinessProfileDefinition {
  key: BusinessProfileKey;
  label: string;
  subtitle: string;
  botHint: string;
  highlights: string[];
  essentialModules: PersonaModuleId[];
  controlTowerLabels: {
    openWorkLabel: string;
    escalatedLabel: string;
    throughputLabel: string;
  };
}

export type PersonaModuleId =
  | "products"
  | "orders"
  | "appointments"
  | "queue"
  | "ticketing"
  | "interventions"
  | "crm_backoffice";

export interface PersonaModuleDefinition {
  id: PersonaModuleId;
  title: string;
  path: string;
  desc: string;
}

export const PERSONA_MODULES: Record<PersonaModuleId, PersonaModuleDefinition> = {
  products: {
    id: "products",
    title: "Catalogue",
    path: "/products",
    desc: "Offres, visuels et codes produit",
  },
  orders: {
    id: "orders",
    title: "Ventes",
    path: "/orders",
    desc: "Ventes, paiements et suivi",
  },
  appointments: {
    id: "appointments",
    title: "Agenda",
    path: "/modules/appointments",
    desc: "Creneaux, confirmations et suivi",
  },
  queue: {
    id: "queue",
    title: "File d'attente",
    path: "/modules/queue",
    desc: "Tickets file, appel et service",
  },
  ticketing: {
    id: "ticketing",
    title: "Billetterie",
    path: "/modules/ticketing",
    desc: "Emission et controle des tickets",
  },
  interventions: {
    id: "interventions",
    title: "Interventions",
    path: "/modules/interventions",
    desc: "Suivi terrain et resolution",
  },
  crm_backoffice: {
    id: "crm_backoffice",
    title: "Centre CRM",
    path: "/modules/crm-backoffice",
    desc: "SLA, assignations, escalades et historique",
  },
};

export const BUSINESS_PROFILE_ORDER: BusinessProfileKey[] = [
  "shop",
  "events",
  "appointments",
  "queue_management",
  "banking_microfinance",
  "insurance",
  "telecom",
  "utilities",
  "education",
  "transport",
  "field_services",
  "rental",
  "healthcare_private",
];

export const BUSINESS_PROFILES: Record<BusinessProfileKey, BusinessProfileDefinition> = {
  shop: {
    key: "shop",
    label: "Boutique e-commerce",
    subtitle: "Commerce e-commerce",
    botHint: "Clients: envoyez le code produit (ex: ROBE1) pour commander.",
    highlights: ["Catalogue produit", "Paiement mobile", "Suivi livraison"],
    essentialModules: ["products", "orders", "crm_backoffice"],
    controlTowerLabels: {
      openWorkLabel: "Ventes en cours",
      escalatedLabel: "Litiges / escalades",
      throughputLabel: "Produits actifs",
    },
  },
  events: {
    key: "events",
    label: "Billetterie evenementielle",
    subtitle: "Billetterie evenementielle",
    botHint: "Clients: envoyez le code ticket (ex: VIP1) pour reserver une place.",
    highlights: ["E-ticket", "Controle entree", "Places limitees"],
    essentialModules: ["ticketing", "orders", "crm_backoffice"],
    controlTowerLabels: {
      openWorkLabel: "Tickets a traiter",
      escalatedLabel: "Incidents evenement",
      throughputLabel: "Billets emis",
    },
  },
  appointments: {
    key: "appointments",
    label: "Agenda services",
    subtitle: "Prise de rendez-vous",
    botHint: "Clients: envoyez RDV + service (ex: RDV CARDIO) pour un creneau.",
    highlights: ["Calendrier creneaux", "Rappels auto", "Validation agent"],
    essentialModules: ["appointments", "queue", "crm_backoffice"],
    controlTowerLabels: {
      openWorkLabel: "RDV en attente",
      escalatedLabel: "Retards critiques",
      throughputLabel: "Creneaux traites",
    },
  },
  queue_management: {
    key: "queue_management",
    label: "Gestion file d'attente",
    subtitle: "File d'attente numerique",
    botHint: "Clients: envoyez FILE + service pour prendre un numero de passage.",
    highlights: ["Tickets file", "Appel intelligent", "Estimation attente"],
    essentialModules: ["queue", "crm_backoffice"],
    controlTowerLabels: {
      openWorkLabel: "Tickets en attente",
      escalatedLabel: "Files bloquees",
      throughputLabel: "Passages traites",
    },
  },
  banking_microfinance: {
    key: "banking_microfinance",
    label: "Banque / Microfinance",
    subtitle: "Service client financier",
    botHint: "Clients: envoyez RECLAMATION, INFO, CREDIT ou SUIVI DOSSIER.",
    highlights: ["Ticket reclamation", "Suivi dossier", "Routage conseiller"],
    essentialModules: ["crm_backoffice", "appointments", "queue"],
    controlTowerLabels: {
      openWorkLabel: "Dossiers ouverts",
      escalatedLabel: "Dossiers sensibles",
      throughputLabel: "Dossiers resolus",
    },
  },
  insurance: {
    key: "insurance",
    label: "Assurance",
    subtitle: "Gestion sinistres et contrats",
    botHint: "Clients: envoyez SINISTRE, POLICE ou RECLAMATION.",
    highlights: ["Declaration sinistre", "Suivi police", "Escalade gestionnaire"],
    essentialModules: ["crm_backoffice", "interventions", "appointments"],
    controlTowerLabels: {
      openWorkLabel: "Sinistres ouverts",
      escalatedLabel: "Sinistres critiques",
      throughputLabel: "Dossiers clotures",
    },
  },
  telecom: {
    key: "telecom",
    label: "Telecom",
    subtitle: "Support abonnements et incidents",
    botHint: "Clients: envoyez FORFAIT, RECLAMATION ou ASSISTANCE.",
    highlights: ["Support forfait", "Incident reseau", "Ticket SAV"],
    essentialModules: ["crm_backoffice", "interventions", "queue"],
    controlTowerLabels: {
      openWorkLabel: "Incidents ouverts",
      escalatedLabel: "Escalades reseau",
      throughputLabel: "Tickets resolus",
    },
  },
  utilities: {
    key: "utilities",
    label: "Energie / Eau",
    subtitle: "Relation usager",
    botHint: "Clients: envoyez FACTURE, PANNE ou RECLAMATION.",
    highlights: ["Suivi facturation", "Signalement panne", "Priorisation interventions"],
    essentialModules: ["crm_backoffice", "interventions", "queue"],
    controlTowerLabels: {
      openWorkLabel: "Pannes ouvertes",
      escalatedLabel: "Interventions en retard",
      throughputLabel: "Interventions cloturees",
    },
  },
  education: {
    key: "education",
    label: "Formation / Education",
    subtitle: "Inscriptions et suivi apprenants",
    botHint: "Clients: envoyez COURS pour voir les formations disponibles.",
    highlights: ["Inscriptions", "Presence", "Attestations numeriques"],
    essentialModules: ["appointments", "crm_backoffice", "queue"],
    controlTowerLabels: {
      openWorkLabel: "Inscriptions en cours",
      escalatedLabel: "Cas apprenants critiques",
      throughputLabel: "Sessions finalisees",
    },
  },
  transport: {
    key: "transport",
    label: "Transport & navette",
    subtitle: "Reservation trajet",
    botHint: "Clients: envoyez TRAJET pour demander un trajet ou une navette.",
    highlights: ["Reservation siege", "Ticket mobile", "Suivi depart"],
    essentialModules: ["ticketing", "queue", "crm_backoffice"],
    controlTowerLabels: {
      openWorkLabel: "Trajets en cours",
      escalatedLabel: "Retards critiques",
      throughputLabel: "Billets utilises",
    },
  },
  field_services: {
    key: "field_services",
    label: "Interventions terrain",
    subtitle: "Planning interventions",
    botHint: "Clients: envoyez INTERVENTION + besoin (ex: INTERVENTION CLIM).",
    highlights: ["Demande intervention", "Assignation technicien", "Compte-rendu mission"],
    essentialModules: ["interventions", "crm_backoffice", "appointments"],
    controlTowerLabels: {
      openWorkLabel: "Interventions ouvertes",
      escalatedLabel: "Tickets critiques",
      throughputLabel: "Missions resolues",
    },
  },
  rental: {
    key: "rental",
    label: "Location de biens",
    subtitle: "Gestion location",
    botHint: "Clients: envoyez LOCATION pour voir les biens disponibles.",
    highlights: ["Disponibilite", "Caution", "Contrat digital"],
    essentialModules: ["products", "orders", "crm_backoffice"],
    controlTowerLabels: {
      openWorkLabel: "Locations en cours",
      escalatedLabel: "Litiges location",
      throughputLabel: "Contrats actifs",
    },
  },
  healthcare_private: {
    key: "healthcare_private",
    label: "Sante privee",
    subtitle: "Parcours patient",
    botHint: "Clients: envoyez CONSULTATION pour prendre rendez-vous.",
    highlights: ["Triage initial", "RDV medecin", "Rappel consultation"],
    essentialModules: ["appointments", "queue", "crm_backoffice"],
    controlTowerLabels: {
      openWorkLabel: "Patients en attente",
      escalatedLabel: "Cas prioritaires",
      throughputLabel: "Consultations finalisees",
    },
  },
};


