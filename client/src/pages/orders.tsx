import { useState, useEffect } from "react";
import { Package, Phone, Clock, CheckCircle, XCircle, AlertCircle, MessageCircle, Download, Truck, Eye } from "lucide-react";

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
import { InitiateChatDialog } from "@/components/initiate-chat-dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getOrders, getProducts, updateOrder, type Order, type Product } from "@/lib/firebase";
import { exportOrdersToCSV } from "@/lib/export-utils";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "En attente", color: "bg-yellow-500", icon: Clock },
  reserved: { label: "Réservé", color: "bg-blue-500", icon: AlertCircle },
  paid: { label: "Payé", color: "bg-green-500", icon: CheckCircle },
  shipped: { label: "Expédié", color: "bg-purple-500", icon: Truck },
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
  
  // Action dialogs
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!entityId) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [ordersData, productsData] = await Promise.all([
          getOrders(entityId),
          getProducts(entityId),
        ]);
        setOrders(ordersData);
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

  // Update order status
  const handleUpdateStatus = async (orderId: string, newStatus: Order["status"]) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      await updateOrder(orderId, { status: newStatus });
      
      // Update local state
      setOrders(orders.map(o => 
        o.id === orderId ? { ...o, status: newStatus } : o
      ));
      
      toast({
        title: "Commande mise à jour",
        description: `La commande est maintenant ${statusConfig[newStatus].label}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la commande",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
      setShowConfirmDialog(false);
      setShowCancelDialog(false);
      setShowShipDialog(false);
      setSelectedOrder(null);
    }
  };

  // Calculate stats from orders
  const stats = {
    pending: orders.filter(o => o.status === "pending").length,
    reserved: orders.filter(o => o.status === "reserved").length,
    paid: orders.filter(o => o.status === "paid").length,
    expired: orders.filter(o => o.status === "expired").length,
    totalRevenue: orders.filter(o => o.status === "paid").reduce((sum, o) => sum + o.totalAmount, 0),
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || "Produit";
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ventes</h1>
          <p className="text-muted-foreground">Suivi des Ventes WhatsApp</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => exportOrdersToCSV(orders)}
            disabled={orders.length === 0}
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </Button>
          <InitiateChatDialog
            trigger={
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <MessageCircle className="w-4 h-4" />
                Contacter un client
              </Button>
            }
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
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
                <p className="text-sm text-muted-foreground">Expirées</p>
                <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-400 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenu total</p>
                <p className="text-xl font-bold text-green-600">
                  {formatPrice(stats.totalRevenue)}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historique des Ventes</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune commande pour le moment</p>
              <p className="text-sm mt-2">Les Ventes WhatsApp apparaîtront ici</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {orders.map((order) => {
                  const config = statusConfig[order.status];
                  const StatusIcon = config.icon;
                  const productName = getProductName(order.productId);
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${config.color} bg-opacity-20`}>
                          <StatusIcon className={`h-5 w-5 ${config.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{productName}</span>
                            <Badge variant="outline">x{order.quantity}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            <span>{order.clientName || order.clientPhone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        {/* Action buttons based on status */}
                        {order.status === "reserved" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowConfirmDialog(true);
                              }}
                              title="Confirmer le paiement"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowShipDialog(true);
                              }}
                              title="Marquer comme expédié"
                            >
                              <Truck className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {order.status === "paid" && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowShipDialog(true);
                            }}
                            title="Marquer comme expédié"
                          >
                            <Truck className="w-4 h-4" />
                          </Button>
                        )}
                        {(order.status === "reserved" || order.status === "pending") && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowCancelDialog(true);
                            }}
                            title="Annuler la commande"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <InitiateChatDialog
                          defaultPhone={order.clientPhone}
                          trigger={
                            <Button size="sm" variant="ghost" className="text-green-600 hover:text-green-700 hover:bg-green-50" title="Contacter le client">
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          }
                        />
                        <div>
                          <p className="font-semibold">{formatPrice(order.totalAmount)}</p>
                          <div className="flex items-center gap-2 justify-end mt-1">
                            <Badge
                              variant={order.status === "paid" ? "default" : "secondary"}
                              className={order.status === "paid" ? "bg-green-600" : ""}
                            >
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Confirm Payment Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le paiement</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Commande #${selectedOrder.id} - ${getProductName(selectedOrder.productId)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              Êtes-vous sûr d'avoir reçu le paiement de <strong>{selectedOrder && formatPrice(selectedOrder.totalAmount)}</strong> ?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isUpdating}>
              Annuler
            </Button>
            <Button 
              onClick={() => selectedOrder && handleUpdateStatus(selectedOrder.id, "paid")} 
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? "Traitement..." : "✅ Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la commande</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Commande #${selectedOrder.id} - ${getProductName(selectedOrder.productId)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-red-600">
              ⚠️ Cette action est irréversible. Le stock sera libéré.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isUpdating}>
              Retour
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedOrder && handleUpdateStatus(selectedOrder.id, "cancelled")} 
              disabled={isUpdating}
            >
              {isUpdating ? "Traitement..." : "❌ Annuler"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ship Order Dialog */}
      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme expédié</DialogTitle>
            <DialogDescription>
              {selectedOrder && `Commande #${selectedOrder.id} - ${getProductName(selectedOrder.productId)}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm">
              La commande est prête à être livrée au client.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShipDialog(false)} disabled={isUpdating}>
              Annuler
            </Button>
            <Button 
              onClick={() => selectedOrder && handleUpdateStatus(selectedOrder.id, "paid")} 
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? "Traitement..." : "🚚 Expédier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

