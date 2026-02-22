import { useState, useEffect } from "react";
import { Package, Clock, CheckCircle, XCircle, AlertCircle, Truck, ChevronDown, ChevronUp, MapPin, Send } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getOrders, getProducts, updateOrder, getVendorConfig, type Order, type Product, type OrderStatus } from "@/lib/firebase";
import { exportOrdersToCSV } from "@/lib/export-utils";

const statusConfig: Record<OrderStatus, { label: string; color: string; icon: any; nextAction?: OrderStatus }> = {
  pending: { label: "En attente", color: "bg-yellow-500", icon: Clock, nextAction: "paid" },
  reserved: { label: "Réservé", color: "bg-blue-500", icon: AlertCircle, nextAction: "paid" },
  paid: { label: "Payé", color: "bg-green-500", icon: CheckCircle, nextAction: "shipped" },
  shipped: { label: "En livraison", color: "bg-purple-500", icon: Truck, nextAction: "delivered" },
  delivered: { label: "Livré", color: "bg-indigo-500", icon: CheckCircle },
  expired: { label: "Expiré", color: "bg-gray-500", icon: XCircle },
  cancelled: { label: "Annulé", color: "bg-red-500", icon: XCircle },
};

export default function Orders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const entityId = user?.entityId || user?.id;
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!entityId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [ordersData, productsData] = await Promise.all([
          getOrders(entityId),
          getProducts(entityId),
        ]);
        
        // ✅ CORRECTION: Supprimer les doublons par client + produit
        const uniqueOrders = removeDuplicateOrders(ordersData);
        setOrders(uniqueOrders);
        setProducts(productsData);
      } catch (error) {
        console.error("Error loading orders:", error);
        toast({ title: "Erreur", description: "Impossible de charger les Ventes", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [entityId, toast]);

  // ✅ CORRECTION: Fonction pour supprimer les doublons
  const removeDuplicateOrders = (ordersList: Order[]): Order[] => {
    const uniqueMap = new Map<string, Order>();
    
    ordersList.forEach(order => {
      // Clé unique: client + produit + statut (pour éviter les vrais doublons)
      const key = `${order.clientPhone}-${order.productId}-${order.status}`;
      
      // Garder seulement la première occurrence ou la plus récente
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, order);
      }
    });
    
    return Array.from(uniqueMap.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Produit";
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ✅ INNOVATION: Obtenir la position GPS
  const getCurrentPosition = () => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Géolocalisation non supportée"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // ✅ INNOVATION: Action unique intelligente selon le statut
  const handleSmartAction = async () => {
    if (!selectedOrder || !user) return;

    const currentStatus = selectedOrder.status;
    const nextStatus = statusConfig[currentStatus]?.nextAction;

    if (!nextStatus) {
      toast({ title: "Action non disponible", description: "Cette commande est terminée", variant: "default" });
      return;
    }

    try {
      setIsUpdating(true);
      await updateOrder(selectedOrder.id, { status: nextStatus });

      // Update local state
      setOrders(orders.map(o =>
        o.id === selectedOrder.id ? { ...o, status: nextStatus } : o
      ));

      // ✅ INNOVATION: Notification GPS automatique pour livraison
      if (nextStatus === "shipped") {
        await sendGPSNotification(selectedOrder);
      }

      toast({
        title: "Commande mise à jour",
        description: `La commande est maintenant ${statusConfig[nextStatus].label}`,
      });

      setShowActionDialog(false);
      setSelectedOrder(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la commande",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // ✅ INNOVATION: Envoyer notification GPS au client
  const sendGPSNotification = async (order: Order) => {
    if (!entityId) return;
    
    try {
      // Obtenir position GPS actuelle
      const position = await getCurrentPosition();
      setGpsCoords(position);
      setGpsEnabled(true);

      // Récupérer la position Google Maps configurée par l'entité
      const vendorCfg = await getVendorConfig(entityId);
      const mapsLink = vendorCfg?.googleMapsPosition || `https://www.google.com/maps?q=${position.lat.toFixed(6)},${position.lng.toFixed(6)}`;
      
      const cleanPhone = order.clientPhone.replace(/[^0-9]/g, "");
      
      // ✅ Message OPTIMISÉ - Court et efficace
      const message = `🚚 *Livraison en cours !*\n\nVotre commande #${order.id} est en route.\n\n📍 Suivez le livreur:\n${mapsLink}\n\n🕐 15-30 min`;

      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      toast({
        title: "Livraison démarrée",
        description: "Position GPS envoyée au client",
      });
    } catch (error) {
      console.error("GPS error:", error);
      // Fallback sans GPS
      const cleanPhone = order.clientPhone.replace(/[^0-9]/g, "");
      const message = `🚚 *Livraison en cours !*\n\nVotre commande #${order.id} est en route. Restez disponible !`;
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const openActionDialog = (order: Order) => {
    setSelectedOrder(order);
    setShowActionDialog(true);
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const stats = {
    pending: orders.filter(o => o.status === "pending").length,
    reserved: orders.filter(o => o.status === "reserved").length,
    paid: orders.filter(o => o.status === "paid").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    expired: orders.filter(o => o.status === "expired").length,
    totalRevenue: orders.filter(o => o.status === "paid" || o.status === "delivered").reduce((sum, o) => sum + o.totalAmount, 0),
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ventes</h1>
          <p className="text-muted-foreground">Suivi des Ventes WhatsApp en temps réel</p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => exportOrdersToCSV(orders)}
          disabled={orders.length === 0}
        >
          <Package className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Réservées</p>
                <p className="text-2xl font-bold text-blue-600">{stats.reserved}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payées</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Livraison</p>
                <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
              </div>
              <Truck className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu total</p>
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(stats.totalRevenue)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ✅ INNOVATION: Accordion Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des Ventes ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune commande pour le moment</p>
              <p className="text-sm mt-2">Les Ventes WhatsApp apparaîtront ici</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {orders.map((order, index) => {
                  const config = statusConfig[order.status];
                  const StatusIcon = config.icon;
                  const productName = getProductName(order.productId);
                  const isExpanded = expandedOrderId === order.id;
                  const nextAction = config.nextAction;

                  return (
                    <div
                      key={order.id}
                      className={`rounded-lg border bg-card transition-all ${
                        isExpanded ? "border-primary shadow-md" : "hover:bg-muted/50"
                      }`}
                    >
                      {/* Header - Always visible */}
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer"
                        onClick={() => toggleOrderExpand(order.id)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-2 rounded-full ${config.color} bg-opacity-20`}>
                            <StatusIcon className={`h-4 w-4 ${config.color.replace('bg-', 'text-')}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{productName}</span>
                              <Badge variant="outline" className="text-xs">x{order.quantity}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {order.clientName || order.clientPhone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={order.status === "paid" || order.status === "delivered" ? "default" : "secondary"}
                            className={order.status === "paid" || order.status === "delivered" ? "bg-green-600" : ""}
                          >
                            {config.label}
                          </Badge>
                          <span className="font-semibold text-sm">{formatPrice(order.totalAmount)}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t p-4 bg-muted/30 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Client</p>
                              <p className="font-medium">{order.clientName || "Client"}</p>
                              <p className="text-xs text-muted-foreground">{order.clientPhone}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Commande</p>
                              <p className="font-medium">#{order.id}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                            </div>
                          </div>

                          {/* ✅ BOUTON UNIQUE INTELLIGENT */}
                          {nextAction && (
                            <Button
                              className="w-full gap-2"
                              size="lg"
                              onClick={() => openActionDialog(order)}
                              disabled={isUpdating}
                            >
                              {nextAction === "paid" && <CheckCircle className="w-4 h-4" />}
                              {nextAction === "shipped" && <Truck className="w-4 h-4" />}
                              {nextAction === "delivered" && <MapPin className="w-4 h-4" />}
                              {isUpdating ? "Traitement..." : (
                                <>
                                  {nextAction === "paid" && "✅ Valider le paiement"}
                                  {nextAction === "shipped" && "🚚 Démarrer livraison (GPS)"}
                                  {nextAction === "delivered" && "📍 Confirmer livraison"}
                                </>
                              )}
                            </Button>
                          )}

                          {!nextAction && (
                            <p className="text-center text-sm text-muted-foreground">
                              {order.status === "delivered" ? "✅ Commande terminée" : "⚠️ Commande annulée/expirée"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Smart Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOrder && statusConfig[selectedOrder.status].nextAction === "paid" && <CheckCircle className="w-5 h-5 text-green-600" />}
              {selectedOrder && statusConfig[selectedOrder.status].nextAction === "shipped" && <Truck className="w-5 h-5 text-purple-600" />}
              {selectedOrder && statusConfig[selectedOrder.status].nextAction === "delivered" && <MapPin className="w-5 h-5 text-blue-600" />}
              {selectedOrder && selectedOrder.status === "reserved" && "Valider le paiement"}
              {selectedOrder && selectedOrder.status === "paid" && "Démarrer la livraison"}
              {selectedOrder && selectedOrder.status === "shipped" && "Confirmer livraison"}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && `Commande #${selectedOrder.id} - ${getProductName(selectedOrder.productId)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            {selectedOrder && selectedOrder.status === "reserved" && (
              <p className="text-sm">
                Confirmez-vous avoir reçu le paiement de <strong>{formatPrice(selectedOrder.totalAmount)}</strong> ?
              </p>
            )}
            {selectedOrder && selectedOrder.status === "paid" && (
              <div className="space-y-2">
                <p className="text-sm">
                  🚚 La livraison va démarrer. Votre position GPS sera envoyée au client.
                </p>
                {gpsEnabled && gpsCoords && (
                  <p className="text-xs text-muted-foreground">
                    📍 Position: {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                  </p>
                )}
              </div>
            )}
            {selectedOrder && selectedOrder.status === "shipped" && (
              <p className="text-sm">
                Confirmez-vous que la commande a été livrée au client ?
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)} disabled={isUpdating}>
              Annuler
            </Button>
            <Button
              onClick={handleSmartAction}
              disabled={isUpdating}
              className={
                selectedOrder?.status === "reserved" ? "bg-green-600 hover:bg-green-700" :
                selectedOrder?.status === "paid" ? "bg-purple-600 hover:bg-purple-700" :
                "bg-blue-600 hover:bg-blue-700"
              }
            >
              {isUpdating ? "Traitement..." : (
                <>
                  {selectedOrder?.status === "reserved" && "✅ Confirmer"}
                  {selectedOrder?.status === "paid" && "🚚 Livrer"}
                  {selectedOrder?.status === "shipped" && "📍 Confirmer"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
