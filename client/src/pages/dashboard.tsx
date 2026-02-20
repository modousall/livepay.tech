import { useState, useEffect } from "react";
import { 
  Package, 
  ShoppingCart, 
  CircleDollarSign, 
  CheckCircle,
  Clock,
  BarChart3,
  MessageCircle,
} from "lucide-react";
import { Link } from "wouter";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useAnalytics } from "@/hooks/use-analytics";
import { OnboardingChecklist, ContextualOnboardingModal } from "@/components/onboarding";
import { QuickActions } from "@/components/quick-actions";
import { StatsSkeleton } from "@/components/empty-state";
import { RevenueChart, PerformanceMetrics, TopProductsCard, ConversionFunnel } from "@/components/analytics-charts";
import {
  getVendorConfig,
  getProducts,
  getOrders,
  getCrmTickets,
  updateVendorConfig,
  upsertCrmSlaPolicy,
  type VendorConfig,
  type Product,
  type Order,
  type CrmTicket,
  type CrmModule,
} from "@/lib/firebase";
import { BUSINESS_PROFILES, PERSONA_MODULES, type BusinessProfileKey } from "@/lib/business-profiles";

interface OrderStats {
  pending: number;
  reserved: number;
  paid: number;
  expired: number;
  totalRevenue: number;
}

interface SlaPreset {
  module: CrmModule;
  targetMinutesLow: number;
  targetMinutesNormal: number;
  targetMinutesHigh: number;
  targetMinutesCritical: number;
  escalationMinutes: number;
}

const CONTEXTUAL_ONBOARDING_KEY_PREFIX = "livepay_contextual_onboarding_done_";

const DEFAULT_SLA_PRESET: SlaPreset[] = [
  {
    module: "appointments",
    targetMinutesLow: 24 * 60,
    targetMinutesNormal: 8 * 60,
    targetMinutesHigh: 120,
    targetMinutesCritical: 30,
    escalationMinutes: 30,
  },
];

const PROFILE_SLA_PRESETS: Partial<Record<BusinessProfileKey, SlaPreset[]>> = {
  banking_microfinance: [
    { module: "banking_microfinance", targetMinutesLow: 16 * 60, targetMinutesNormal: 6 * 60, targetMinutesHigh: 120, targetMinutesCritical: 20, escalationMinutes: 25 },
  ],
  insurance: [
    { module: "insurance", targetMinutesLow: 24 * 60, targetMinutesNormal: 8 * 60, targetMinutesHigh: 180, targetMinutesCritical: 30, escalationMinutes: 30 },
    { module: "interventions", targetMinutesLow: 16 * 60, targetMinutesNormal: 6 * 60, targetMinutesHigh: 120, targetMinutesCritical: 30, escalationMinutes: 20 },
  ],
  telecom: [
    { module: "telecom", targetMinutesLow: 12 * 60, targetMinutesNormal: 4 * 60, targetMinutesHigh: 90, targetMinutesCritical: 15, escalationMinutes: 15 },
    { module: "interventions", targetMinutesLow: 12 * 60, targetMinutesNormal: 4 * 60, targetMinutesHigh: 90, targetMinutesCritical: 20, escalationMinutes: 15 },
  ],
  utilities: [
    { module: "utilities", targetMinutesLow: 16 * 60, targetMinutesNormal: 6 * 60, targetMinutesHigh: 120, targetMinutesCritical: 20, escalationMinutes: 20 },
    { module: "interventions", targetMinutesLow: 16 * 60, targetMinutesNormal: 6 * 60, targetMinutesHigh: 120, targetMinutesCritical: 25, escalationMinutes: 20 },
  ],
  queue_management: [
    { module: "queue_management", targetMinutesLow: 6 * 60, targetMinutesNormal: 2 * 60, targetMinutesHigh: 45, targetMinutesCritical: 10, escalationMinutes: 10 },
  ],
  events: [
    { module: "ticketing", targetMinutesLow: 12 * 60, targetMinutesNormal: 4 * 60, targetMinutesHigh: 60, targetMinutesCritical: 15, escalationMinutes: 15 },
  ],
  appointments: [
    { module: "appointments", targetMinutesLow: 12 * 60, targetMinutesNormal: 4 * 60, targetMinutesHigh: 60, targetMinutesCritical: 15, escalationMinutes: 15 },
  ],
  field_services: [
    { module: "interventions", targetMinutesLow: 12 * 60, targetMinutesNormal: 4 * 60, targetMinutesHigh: 60, targetMinutesCritical: 20, escalationMinutes: 20 },
  ],
};

const RECOMMENDED_MODE_BY_PROFILE: Record<BusinessProfileKey, "simplified" | "expert"> = {
  shop: "simplified",
  events: "simplified",
  appointments: "simplified",
  queue_management: "simplified",
  banking_microfinance: "simplified",
  insurance: "simplified",
  telecom: "simplified",
  utilities: "simplified",
  education: "simplified",
  transport: "simplified",
  field_services: "expert",
  rental: "simplified",
  healthcare_private: "simplified",
};

const CRM_MODULE_LABELS: Record<CrmModule, string> = {
  appointments: "Agenda",
  queue_management: "File d'attente",
  ticketing: "Billetterie",
  interventions: "Interventions",
  banking_microfinance: "Banque / Microfinance",
  insurance: "Assurance",
  telecom: "Telecom",
  utilities: "Energie / Eau",
};

function getSlaPreset(profileKey: BusinessProfileKey): SlaPreset[] {
  return PROFILE_SLA_PRESETS[profileKey] || DEFAULT_SLA_PRESET;
}

function formatMinutes(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${hours}h`;
  }
  return `${minutes}m`;
}

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Data state
  const [config, setConfig] = useState<VendorConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [crmTickets, setCrmTickets] = useState<CrmTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Contextual onboarding state for first login
  const [showContextualOnboarding, setShowContextualOnboarding] = useState(false);
  const [isApplyingContextual, setIsApplyingContextual] = useState(false);
  const [contextualMode, setContextualMode] = useState<"simplified" | "expert">("simplified");
  const [showOnboarding, setShowOnboarding] = useState(true);
  
  // Load data from Firebase
  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [configData, productsData, ordersData] = await Promise.all([
          getVendorConfig(user.id),
          getProducts(user.id),
          getOrders(user.id),
        ]);
        setConfig(configData);
        setProducts(productsData);
        setOrders(ordersData);
        const crmData = await getCrmTickets(user.id);
        setCrmTickets(crmData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast({ title: "Erreur", description: "Impossible de charger les données", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, toast]);
  
  // Calculate stats from orders
  const stats: OrderStats = {
    pending: orders.filter(o => o.status === "pending").length,
    reserved: orders.filter(o => o.status === "reserved").length,
    paid: orders.filter(o => o.status === "paid").length,
    expired: orders.filter(o => o.status === "expired").length,
    totalRevenue: orders.filter(o => o.status === "paid").reduce((sum, o) => sum + o.totalAmount, 0),
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const recentOrders = orders.slice(0, 5);
  const profileKey = (config?.segment as BusinessProfileKey) || "shop";
  const profileMeta = BUSINESS_PROFILES[profileKey] || BUSINESS_PROFILES.shop;
  const isExpertMode = (config?.uiMode || "simplified") === "expert";
  const moduleIds = isExpertMode
    ? (Object.keys(PERSONA_MODULES) as Array<keyof typeof PERSONA_MODULES>)
    : profileMeta.essentialModules;
  const quickModules = moduleIds.slice(0, 3).map((id) => PERSONA_MODULES[id]);
  const openCrmCount = crmTickets.filter((t) => ["open", "in_progress", "waiting_customer"].includes(t.status)).length;
  const escalatedCount = crmTickets.filter((t) => t.status === "escalated" || t.escalated).length;
  
  // Analytics data
  const analytics = useAnalytics(orders, products);
  
  // Onboarding state calculations
  const hasProducts = products.length > 0;
  const hasPhone = true; // TODO: Check from config when available
  const hasLiveMode = true;
  const recommendedMode = RECOMMENDED_MODE_BY_PROFILE[profileKey];
  const slaPreset = getSlaPreset(profileKey);
  const slaPreview = slaPreset.map((preset) => ({
    moduleLabel: CRM_MODULE_LABELS[preset.module],
    targetLabel: `N ${formatMinutes(preset.targetMinutesNormal)} / H ${formatMinutes(preset.targetMinutesHigh)}`,
  }));

  useEffect(() => {
    if (!user || !config) return;

    const localKey = `${CONTEXTUAL_ONBOARDING_KEY_PREFIX}${user.id}`;
    const localDone = localStorage.getItem(localKey) === "true";
    const remoteDone = Boolean(config.contextualOnboardingCompletedAt);

    if (localDone || remoteDone) return;

    setContextualMode(recommendedMode);
    setShowContextualOnboarding(true);
  }, [user, config, recommendedMode]);

  const markContextualOnboardingDone = async (uiModeToSave: "simplified" | "expert") => {
    if (!user || !config) return;

    const completedAt = new Date();
    await updateVendorConfig(config.id, {
      contextualOnboardingCompletedAt: completedAt,
      uiMode: uiModeToSave,
    });
    setConfig((prev) => (
      prev
        ? { ...prev, uiMode: uiModeToSave, contextualOnboardingCompletedAt: completedAt }
        : prev
    ));

    localStorage.setItem("livepay_visited", "true");
    localStorage.setItem(`${CONTEXTUAL_ONBOARDING_KEY_PREFIX}${user.id}`, "true");
  };

  const handleApplyContextualOnboarding = async () => {
    if (!user || !config) return;
    setIsApplyingContextual(true);

    try {
      await Promise.all(
        slaPreset.map((preset) =>
          upsertCrmSlaPolicy(user.id, preset.module, {
            targetMinutesLow: preset.targetMinutesLow,
            targetMinutesNormal: preset.targetMinutesNormal,
            targetMinutesHigh: preset.targetMinutesHigh,
            targetMinutesCritical: preset.targetMinutesCritical,
            escalationMinutes: preset.escalationMinutes,
            active: true,
          })
        )
      );

      await markContextualOnboardingDone(contextualMode);
      setShowContextualOnboarding(false);
      toast({
        title: "Configuration appliquee",
        description: "Mode recommande et SLA sectoriels actives.",
      });
    } catch (error) {
      console.error("Error applying contextual onboarding:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer la preconfiguration.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingContextual(false);
    }
  };

  const handleSkipContextualOnboarding = async () => {
    if (!config) return;
    setIsApplyingContextual(true);

    try {
      const uiModeToKeep = (config.uiMode || recommendedMode) as "simplified" | "expert";
      await markContextualOnboardingDone(uiModeToKeep);
      setShowContextualOnboarding(false);
    } catch (error) {
      console.error("Error skipping contextual onboarding:", error);
      toast({
        title: "Erreur",
        description: "Impossible de finaliser l'onboarding.",
        variant: "destructive",
      });
    } finally {
      setIsApplyingContextual(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <StatsSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {showContextualOnboarding && (
        <ContextualOnboardingModal
          profileLabel={profileMeta.label}
          recommendedMode={recommendedMode}
          selectedMode={contextualMode}
          onModeChange={setContextualMode}
          slaPreview={slaPreview}
          isApplying={isApplyingContextual}
          onApply={handleApplyContextualOnboarding}
          onSkip={handleSkipContextualOnboarding}
        />
      )}
      
      {/* Quick Actions FAB */}
      <QuickActions />
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Tableau de bord</h1>
        <p className="text-muted-foreground">
          LivePay - {profileMeta.subtitle} ({isExpertMode ? "mode expert" : "mode simplifie"})
        </p>
      </div>

      {/* Onboarding Checklist - shows until all steps complete or dismissed */}
      {showOnboarding && (
        <OnboardingChecklist
          hasProducts={hasProducts}
          hasPhone={hasPhone}
          hasLiveMode={hasLiveMode}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

      <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Chatbot Actif 24/24</h2>
                <p className="text-sm text-muted-foreground">
                  Le chatbot accepte les commandes WhatsApp en continu.
                </p>
              </div>
            </div>
            <Badge className="bg-green-500 hover:bg-green-600">Actif</Badge>
          </div>

          <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <p className="text-sm">
              {profileMeta.botHint}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Centre de pilotage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground">{profileMeta.controlTowerLabels.openWorkLabel}</p>
              <p className="text-2xl font-bold">{openCrmCount}</p>
            </div>
            <div className="rounded-lg border p-3 bg-amber-50 dark:bg-amber-950/20">
              <p className="text-xs text-muted-foreground">{profileMeta.controlTowerLabels.escalatedLabel}</p>
              <p className="text-2xl font-bold">{escalatedCount}</p>
            </div>
            <div className="rounded-lg border p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground">{profileMeta.controlTowerLabels.throughputLabel}</p>
              <p className="text-2xl font-bold">{profileMeta.highlights.length}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {quickModules.map((module, index) => (
              <Link key={module.id} href={module.path}>
                <Button variant={index === quickModules.length - 1 ? "default" : "outline"} className="w-full">
                  {module.title}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parcours actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {profileMeta.highlights.map((highlight) => (
              <div key={highlight} className="rounded-lg border p-3 text-sm font-medium bg-muted/20">
                {highlight}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.reserved || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payées auj.</p>
                <p className="text-2xl font-bold text-green-600">{stats?.paid || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offres</p>
                <p className="text-2xl font-bold">{products?.filter(p => p.active).length || 0}</p>
              </div>
              <Package className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu total</p>
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(stats?.totalRevenue || 0)}
                </p>
              </div>
              <CircleDollarSign className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytiques
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-4">
          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Ventes récentes</CardTitle>
            <Link href="/orders">
              <Button variant="ghost" size="sm">Voir tout →</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Aucune vente</p>
                <p className="text-xs mt-1">Le chatbot est actif 24/24 pour recevoir des demandes</p>
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="space-y-3">
                  {recentOrders.map((order) => {
                    const product = products.find(p => p.id === order.productId);
                    const productName = product?.name || "Offre";
                    return (
                    <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-sm">{productName} x{order.quantity}</p>
                        <p className="text-xs text-muted-foreground">{order.clientName || order.clientPhone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatPrice(order.totalAmount)}</p>
                        <Badge 
                          variant={order.status === "paid" ? "default" : "secondary"}
                          className={order.status === "paid" ? "bg-green-600" : ""}
                        >
                          {order.status === "paid" ? "Payé" : order.status === "reserved" ? "En attente" : order.status}
                        </Badge>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Products Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              Stock catalogue
            </CardTitle>
            <Link href="/products">
              <Button variant="ghost" size="sm">Gérer →</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {!products || products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Aucune offre</p>
                <Link href="/products">
                  <Button variant="outline" size="sm" className="mt-2">
                    Ajouter une offre
                  </Button>
                </Link>
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {products.filter(p => p.active).slice(0, 8).map((product) => {
                    const availableStock = product.stock - product.reservedStock;
                    const isLowStock = availableStock <= 3;
                    return (
                      <div 
                        key={product.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${isLowStock ? "border-amber-300 bg-amber-50 dark:bg-amber-950/20" : ""}`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {product.keyword}
                            </Badge>
                            <span className="font-medium text-sm">{product.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${isLowStock ? "text-amber-600" : "text-green-600"}`}>
                            {availableStock}
                          </p>
                          <p className="text-xs text-muted-foreground">en stock</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="mt-4">
          {/* Analytics Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart analytics={analytics} />
            </div>
            <PerformanceMetrics analytics={analytics} />
            <TopProductsCard products={analytics.topProducts} />
            <ConversionFunnel analytics={analytics} />
          </div>
        </TabsContent>
      </Tabs>

      {/* How it works */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Comment ça marche ?
          </h3>
          <div className="grid sm:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">1</span>
              <div>
                <p className="font-medium">Ajoutez vos offres</p>
                <p className="text-muted-foreground">Avec un mot-clé simple (ROBE1)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">2</span>
              <div>
                <p className="font-medium">Chatbot actif 24/24</p>
                <p className="text-muted-foreground">Le chatbot reste actif 24/24</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">3</span>
              <div>
                <p className="font-medium">Clients envoient le mot-clé</p>
                <p className="text-muted-foreground">Sur WhatsApp → demande créée</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold shrink-0">4</span>
              <div>
                <p className="font-medium">Paiement mobile money</p>
                <p className="text-muted-foreground">Wave, Orange Money, Carte</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





