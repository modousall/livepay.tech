/**
 * Super Admin Dashboard
 * Platform-wide management for LivePay administrators
 */

import { useState, useEffect } from "react";
import {
  Users,
  Package,
  ShoppingCart,
  CircleDollarSign,
  TrendingUp,
  Search,
  Store,
  Activity,
  Globe,
  Shield,
  Settings,
  MessageCircle,
  CreditCard,
  Bell,
  Save,
  Trash2,
  UserCog,
  Ban,
  CheckCircle,
  RefreshCw,
  Smartphone,
  Wallet,
  Key,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  getAllVendors,
  getAllOrders,
  getAllProducts,
  getPlatformStats,
  getVendorConfigById,
  isSuperAdmin,
  getPlatformConfig,
  updatePlatformConfig,
  updateUserRole,
  updateUserProfile,
  toggleUserStatus,
  deleteUser,
  purgePlatformKeepSuperAdmin,
  type UserProfile,
  type Order,
  type Product,
  type VendorConfig,
  type PlatformConfig,
} from "@/lib/firebase";
import { createEntityWithAdmin, sendWelcomeEmail } from "@/lib/create-entity";

interface PlatformStats {
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  todayOrders: number;
}

export default function SuperAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [vendors, setVendors] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorConfigs, setVendorConfigs] = useState<Map<string, VendorConfig>>(new Map());
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig | null>(null);
  
  const [searchVendor, setSearchVendor] = useState("");
  const [searchOrder, setSearchOrder] = useState("");
  const [searchUser, setSearchUser] = useState("");

  // Create entity dialog
  const [showCreateEntityDialog, setShowCreateEntityDialog] = useState(false);
  const [isCreatingEntity, setIsCreatingEntity] = useState(false);
  const [newEntityData, setNewEntityData] = useState({
    businessName: "",
    adminEmail: "",
    adminPassword: "",
    adminFirstName: "",
    adminLastName: "",
    phone: "",
    sector: "shop",
  });
  
  // User action dialogs
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newRole, setNewRole] = useState<"vendor" | "admin" | "superadmin">("vendor");
  const [newEntityId, setNewEntityId] = useState("");
  
  useEffect(() => {
    if (!user || !user.email || !isSuperAdmin(user.email)) return;
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [statsData, vendorsData, ordersData, productsData, configData] = await Promise.all([
          getPlatformStats(),
          getAllVendors(),
          getAllOrders(),
          getAllProducts(),
          getPlatformConfig(),
        ]);
        
        setStats(statsData);
        setVendors(vendorsData);
        setOrders(ordersData);
        setProducts(productsData);
        setPlatformConfig(configData);
        
        // Load vendor configs
        const configs = new Map<string, VendorConfig>();
        for (const vendor of vendorsData.slice(0, 20)) {
          const config = await getVendorConfigById(vendor.id);
          if (config) configs.set(vendor.id, config);
        }
        setVendorConfigs(configs);
        
      } catch (error) {
        console.error("Error loading admin data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user, toast]);
  
  if (!user || !user.email || !isSuperAdmin(user.email)) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
            <p className="text-muted-foreground">
              Cette page est réservée aux super administrateurs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter out super admin from vendors list
  const filteredVendors = vendors.filter((v) =>
    v.role !== "superadmin" && (
      v.businessName?.toLowerCase().includes(searchVendor.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchVendor.toLowerCase()) ||
      v.firstName?.toLowerCase().includes(searchVendor.toLowerCase())
    )
  );

  const filteredOrders = orders.filter((o) =>
    o.clientPhone?.toLowerCase().includes(searchOrder.toLowerCase()) ||
    o.productName?.toLowerCase().includes(searchOrder.toLowerCase())
  );

  // Filter users for user management (include super admins for display)
  const filteredUsers = vendors.filter((v) =>
    v.businessName?.toLowerCase().includes(searchUser.toLowerCase()) ||
    v.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
    v.firstName?.toLowerCase().includes(searchUser.toLowerCase())
  );
  
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "En attente" },
      reserved: { variant: "outline", label: "Réservé" },
      paid: { variant: "default", label: "Payé" },
      expired: { variant: "destructive", label: "Expiré" },
      cancelled: { variant: "destructive", label: "Annulé" },
    };
    const badge = badges[status] || { variant: "secondary", label: status };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };
  
  // Save platform config
  const handleSaveConfig = async (section: keyof Omit<PlatformConfig, "id" | "updatedAt" | "updatedBy">) => {
    if (!platformConfig || !user?.email) return;
    
    try {
      setIsSaving(true);
      await updatePlatformConfig(
        { [section]: platformConfig[section] },
        user.email
      );
      toast({
        title: "Configuration sauvegardée",
        description: "Les paramètres ont été mis à jour avec succès",
      });
    } catch (error) {
      console.error("Error saving config:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Update user role
  const handleUpdateUserRole = async () => {
    if (!selectedUser) return;
    
    try {
      const entityIdValue = newEntityId.trim();
      await updateUserRole(selectedUser.id, newRole);
      if (entityIdValue && entityIdValue !== selectedUser.entityId) {
        await updateUserProfile(selectedUser.id, { entityId: entityIdValue });
      }
      setVendors(vendors.map(v => 
        v.id === selectedUser.id
          ? { ...v, role: newRole, entityId: entityIdValue || v.entityId }
          : v
      ));
      toast({
        title: "Rôle mis à jour",
        description: `L'utilisateur est maintenant ${newRole}`,
      });
      setShowRoleDialog(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le rôle",
        variant: "destructive",
      });
    }
  };
  
  // Toggle user status
  const handleToggleUserStatus = async (userId: string, currentSuspended: boolean) => {
    try {
      await toggleUserStatus(userId, !currentSuspended);
      setVendors(vendors.map(v => 
        v.id === userId ? { ...v, suspended: !currentSuspended } as any : v
      ));
      toast({
        title: currentSuspended ? "Utilisateur activé" : "Utilisateur suspendu",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive",
      });
    }
  };
  
  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      await deleteUser(selectedUser.id);
      setVendors(vendors.filter(v => v.id !== selectedUser.id));
      toast({
        title: "Utilisateur supprimé",
      });
      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'utilisateur",
        variant: "destructive",
      });
    }
  };
  
  // Update config helper
  const updateConfig = <K extends keyof PlatformConfig>(
    section: K,
    field: string,
    value: any
  ) => {
    if (!platformConfig) return;
    const currentSection = platformConfig[section];
    if (typeof currentSection === 'object' && currentSection !== null) {
      setPlatformConfig({
        ...platformConfig,
        [section]: {
          ...currentSection,
          [field]: value,
        },
      });
    }
  };

  const handlePurgePlatform = async () => {
    const firstConfirm = window.confirm(
      "Cette action va supprimer tous les utilisateurs, boutiques, Offres et Ventes, sauf les super admins. Continuer ?"
    );
    if (!firstConfirm) return;
    const secondConfirm = window.confirm(
      "Confirmation finale: reset complet des données non super-admin. Cette action est irreversible."
    );
    if (!secondConfirm) return;

    try {
      setIsPurging(true);
      const result = await purgePlatformKeepSuperAdmin();
      setVendors([]);
      setProducts([]);
      setOrders([]);
      setVendorConfigs(new Map());
      setStats((prev) =>
        prev
          ? {
              ...prev,
              totalVendors: 0,
              totalProducts: 0,
              totalOrders: 0,
              totalRevenue: 0,
              todayRevenue: 0,
              todayOrders: 0,
            }
          : prev
      );
      toast({
        title: "Plateforme nettoyee",
        description: `${result.deletedUsers} profils Firestore + ${result.deletedAuthUsers} comptes Auth supprimes.`,
      });
    } catch (error) {
      console.error("Purge error:", error);
      toast({
        title: "Erreur purge",
        description: "Impossible de purger toutes les donnees.",
        variant: "destructive",
      });
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Centre de pilotage
          </h1>
          <p className="text-muted-foreground">
            Pilotage global des entites, offres, ventes et securite
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {user?.email}
          </Badge>
          <Button
            variant="destructive"
            onClick={handlePurgePlatform}
            disabled={isPurging}
            className="gap-2"
          >
            {isPurging ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Purger la plateforme
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Entites</p>
                <p className="text-2xl font-bold">{stats?.totalVendors || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Offres</p>
                <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
              </div>
              <Package className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Ventes</p>
                <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Revenu total</p>
                <p className="text-lg font-bold text-green-600">
                  {formatPrice(stats?.totalRevenue || 0)}
                </p>
              </div>
              <CircleDollarSign className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Aujourd'hui</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatPrice(stats?.todayRevenue || 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Cmd jour</p>
                <p className="text-2xl font-bold">{stats?.todayOrders || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-amber-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-end mt-6 mb-4">
        <Button
          onClick={() => setShowCreateEntityDialog(true)}
          className="bg-green-500 hover:bg-green-600"
        >
          <Users className="w-4 h-4 mr-2" />
          Créer une entité
        </Button>
      </div>
      
      {/* Main Tabs */}
      <Tabs defaultValue="vendors" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span className="hidden sm:inline">Entites</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Ventes</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Activité</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Vendors Tab */}
        <TabsContent value="vendors" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Entites ({vendors.length})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchVendor}
                    onChange={(e) => setSearchVendor(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entite</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Offres</TableHead>
                      <TableHead>Date inscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVendors.map((vendor) => {
                      const config = vendorConfigs.get(vendor.id);
                      const productCount = products.filter(p => p.vendorId === vendor.id).length;
                      return (
                        <TableRow key={vendor.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{vendor.businessName || vendor.firstName || "N/A"}</p>
                              <p className="text-xs text-muted-foreground">{vendor.phone || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>{vendor.email}</TableCell>
                          <TableCell>
                            {(vendor as any).suspended ? (
                              <Badge variant="destructive">Suspendu</Badge>
                            ) : config?.status === "active" ? (
                              <Badge className="bg-green-600">Actif 24/24</Badge>
                            ) : !config ? (
                              <Badge variant="outline">Actif (config auto en cours)</Badge>
                            ) : (
                              <Badge variant="secondary">Inactif</Badge>
                            )}
                          </TableCell>
                          <TableCell>{productCount}</TableCell>
                          <TableCell>
                            {format(vendor.createdAt, "dd/MM/yyyy", { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(vendor);
                                setNewRole(vendor.role as any || "vendor");
                                setNewEntityId(vendor.entityId || vendor.id);
                                setShowRoleDialog(true);
                              }}
                              title="Changer le rôle"
                            >
                              <UserCog className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleUserStatus(vendor.id, (vendor as any).suspended)}
                              title={(vendor as any).suspended ? "Activer" : "Suspendre"}
                            >
                              {(vendor as any).suspended ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <Ban className="h-4 w-4 text-orange-600" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(vendor);
                                setShowDeleteDialog(true);
                              }}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Orders Tab */}
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Ventes ({orders.length})</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Produit</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.slice(0, 100).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.clientName || "Client"}</p>
                            <p className="text-xs text-muted-foreground">{order.clientPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>{order.productName || "-"}</TableCell>
                        <TableCell className="font-semibold">{formatPrice(order.totalAmount)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          {format(order.createdAt, "dd/MM HH:mm", { locale: fr })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Users Management Tab */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gestion des utilisateurs</CardTitle>
                  <CardDescription>Gérer les rôles et les accès des utilisateurs</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Inscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((userItem) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{userItem.businessName || userItem.firstName || "N/A"}</p>
                            <p className="text-xs text-muted-foreground">{userItem.phone || "-"}</p>
                          </div>
                        </TableCell>
                        <TableCell>{userItem.email}</TableCell>
                        <TableCell>
                          <Badge variant={
                            userItem.role === "superadmin" ? "default" :
                            userItem.role === "admin" ? "secondary" : "outline"
                          }>
                            {userItem.role || "vendor"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(userItem as any).suspended ? (
                            <Badge variant="destructive">Suspendu</Badge>
                          ) : (
                            <Badge variant="outline" className="text-green-600 border-green-600">Actif</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {format(userItem.createdAt, "dd/MM/yyyy", { locale: fr })}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(userItem);
                              setNewRole(userItem.role as any || "vendor");
                              setNewEntityId(userItem.entityId || userItem.id);
                              setShowRoleDialog(true);
                            }}
                            title="Changer le rôle"
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleUserStatus(userItem.id, (userItem as any).suspended)}
                            title={(userItem as any).suspended ? "Activer" : "Suspendre"}
                          >
                            {(userItem as any).suspended ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Ban className="h-4 w-4 text-orange-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(userItem);
                              setShowDeleteDialog(true);
                            }}
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* Role Change Dialog */}
          <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Modifier le rôle</DialogTitle>
                <DialogDescription>
                  Changer le rôle de {selectedUser?.email}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <Label className="text-sm">Role</Label>
                  <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendor">Entite</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entity-id" className="text-sm">ID Entite</Label>
                  <Input
                    id="entity-id"
                    value={newEntityId}
                    onChange={(event) => setNewEntityId(event.target.value)}
                    placeholder="ID de l'entite"
                  />
                  <p className="text-xs text-muted-foreground">
                    Permet de rattacher plusieurs utilisateurs a la meme entite.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleUpdateUserRole}>
                  Confirmer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer l'utilisateur</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer {selectedUser?.email} ? Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={handleDeleteUser}>
                  Supprimer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Configuration Tab */}
        <TabsContent value="config" className="mt-4">
          <div className="grid gap-6">
            {/* WhatsApp Configuration - Wasender */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">WhatsApp Business - Wasender</CardTitle>
                      <CardDescription>Configuration du chatbot WhatsApp automatique</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={platformConfig?.whatsapp.enabled || false}
                    onCheckedChange={(checked) => updateConfig("whatsapp", "enabled", checked)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                    🚀 Configuration Wasender API
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                    Wasender est une alternative à Meta WhatsApp Cloud API avec :
                  </p>
                  <ul className="text-xs text-green-700 dark:text-green-400 space-y-1 list-disc list-inside">
                    <li>Pas d'approbation Meta requise</li>
                    <li>Messages illimités sans coût par conversation</li>
                    <li>Support technique réactif</li>
                    <li>Multi-instances WhatsApp</li>
                  </ul>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-3">
                    📍 Créez votre compte sur <a href="https://wasenderapi.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">wasenderapi.com</a>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wasender-api-key" className="flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      Wasender API Key
                    </Label>
                    <Input
                      id="wasender-api-key"
                      type="password"
                      placeholder="wa_xxxxxxxxxxxx"
                      value={platformConfig?.whatsapp.wasenderApiKey || ""}
                      onChange={(e) => updateConfig("whatsapp", "wasenderApiKey", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Clé API depuis votre dashboard Wasender
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wasender-instance-id">Instance ID</Label>
                    <Input
                      id="wasender-instance-id"
                      placeholder="inst_xxxxxxxxxxxx"
                      value={platformConfig?.whatsapp.wasenderInstanceId || ""}
                      onChange={(e) => updateConfig("whatsapp", "wasenderInstanceId", e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      ID de l'instance WhatsApp
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wasender-api-url">Wasender API URL</Label>
                  <Input
                    id="wasender-api-url"
                    placeholder="https://api.wasenderapi.com/api/v1"
                    value={platformConfig?.whatsapp.wasenderApiUrl || "https://api.wasenderapi.com/api/v1"}
                    onChange={(e) => updateConfig("whatsapp", "wasenderApiUrl", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL de l'API Wasender
                  </p>
                </div>

                <Separator />

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                    📡 Webhook Wasender
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                    Configurez cette URL dans votre dashboard Wasender pour recevoir les messages :
                  </p>
                  <code className="text-xs bg-blue-100 dark:bg-blue-900/50 px-3 py-2 rounded block break-all font-mono">
                    https://us-central1-live-pay-97ac6.cloudfunctions.net/whatsappWebhookPro
                  </code>
                  <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
                    Événements à activer : ✅ Messages reçus, ✅ Statuts de livraison, ✅ Statuts de lecture
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="wa-account-id">Meta Business Account ID (Optionnel)</Label>
                    <Input
                      id="wa-account-id"
                      placeholder="Ex: 123456789012345"
                      value={platformConfig?.whatsapp.businessAccountId || ""}
                      onChange={(e) => updateConfig("whatsapp", "businessAccountId", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa-phone-id">Meta Phone Number ID (Optionnel)</Label>
                    <Input
                      id="wa-phone-id"
                      placeholder="Ex: 123456789012345"
                      value={platformConfig?.whatsapp.phoneNumberId || ""}
                      onChange={(e) => updateConfig("whatsapp", "phoneNumberId", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa-access-token">Meta Access Token (Optionnel)</Label>
                    <Input
                      id="wa-access-token"
                      type="password"
                      placeholder="••••••••••••"
                      value={platformConfig?.whatsapp.accessToken || ""}
                      onChange={(e) => updateConfig("whatsapp", "accessToken", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wa-verify-token">Meta Verify Token (Optionnel)</Label>
                    <Input
                      id="wa-verify-token"
                      placeholder="Token de vérification webhook"
                      value={platformConfig?.whatsapp.verifyToken || ""}
                      onChange={(e) => updateConfig("whatsapp", "verifyToken", e.target.value)}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleSaveConfig("whatsapp")}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Sauvegarder Configuration WhatsApp
                </Button>
              </CardContent>
            </Card>
            
            {/* Payment Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Paiement</CardTitle>
                    <CardDescription>Configuration des moyens de paiement</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test Mode */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Mode Test</p>
                      <p className="text-xs text-muted-foreground">
                        {platformConfig?.payment.testMode ? "Les paiements sont en mode test" : "Les paiements sont en mode production"}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={platformConfig?.payment.testMode || false}
                    onCheckedChange={(checked) => updateConfig("payment", "testMode", checked)}
                  />
                </div>
                
                <Separator />
                
                {/* Wave */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Wave</span>
                    </div>
                    <Switch
                      checked={platformConfig?.payment.waveEnabled || false}
                      onCheckedChange={(checked) => updateConfig("payment", "waveEnabled", checked)}
                    />
                  </div>
                  {platformConfig?.payment.waveEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          placeholder="••••••••••••"
                          value={platformConfig?.payment.waveApiKey || ""}
                          onChange={(e) => updateConfig("payment", "waveApiKey", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secret Key</Label>
                        <Input
                          type="password"
                          placeholder="••••••••••••"
                          value={platformConfig?.payment.waveSecretKey || ""}
                          onChange={(e) => updateConfig("payment", "waveSecretKey", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Webhook Secret</Label>
                        <Input
                          type="password"
                          placeholder="••••••••••••"
                          value={platformConfig?.payment.waveWebhookSecret || ""}
                          onChange={(e) => updateConfig("payment", "waveWebhookSecret", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Orange Money */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-orange-500" />
                      <span className="font-medium">Orange Money</span>
                    </div>
                    <Switch
                      checked={platformConfig?.payment.orangeMoneyEnabled || false}
                      onCheckedChange={(checked) => updateConfig("payment", "orangeMoneyEnabled", checked)}
                    />
                  </div>
                  {platformConfig?.payment.orangeMoneyEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                          type="password"
                          placeholder="••••••••••••"
                          value={platformConfig?.payment.orangeMoneyApiKey || ""}
                          onChange={(e) => updateConfig("payment", "orangeMoneyApiKey", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secret Key</Label>
                        <Input
                          type="password"
                          placeholder="••••••••••••"
                          value={platformConfig?.payment.orangeMoneySecretKey || ""}
                          onChange={(e) => updateConfig("payment", "orangeMoneySecretKey", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                {/* Stripe */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-purple-500" />
                      <span className="font-medium">Stripe (Cartes)</span>
                    </div>
                    <Switch
                      checked={platformConfig?.payment.stripeEnabled || false}
                      onCheckedChange={(checked) => updateConfig("payment", "stripeEnabled", checked)}
                    />
                  </div>
                  {platformConfig?.payment.stripeEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                      <div className="space-y-2">
                        <Label>Publishable Key</Label>
                        <Input
                          placeholder="pk_test_..."
                          value={platformConfig?.payment.stripePublicKey || ""}
                          onChange={(e) => updateConfig("payment", "stripePublicKey", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secret Key</Label>
                        <Input
                          type="password"
                          placeholder="sk_test_..."
                          value={platformConfig?.payment.stripeSecretKey || ""}
                          onChange={(e) => updateConfig("payment", "stripeSecretKey", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Webhook Secret</Label>
                        <Input
                          type="password"
                          placeholder="whsec_..."
                          value={platformConfig?.payment.stripeWebhookSecret || ""}
                          onChange={(e) => updateConfig("payment", "stripeWebhookSecret", e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* PayDunya */}
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-green-500" />
                      <span className="font-medium">PayDunya (PSP Afrique)</span>
                    </div>
                    <Switch
                      checked={platformConfig?.payment.paydunyaEnabled || false}
                      onCheckedChange={(checked) => updateConfig("payment", "paydunyaEnabled", checked)}
                    />
                  </div>
                  {platformConfig?.payment.paydunyaEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                      <div className="space-y-2">
                        <Label>API Key (Master Key)</Label>
                        <Input
                          placeholder="pk_test_..."
                          value={platformConfig?.payment.paydunyaApiKey || ""}
                          onChange={(e) => updateConfig("payment", "paydunyaApiKey", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secret Key (Private Key)</Label>
                        <Input
                          type="password"
                          placeholder="sk_test_..."
                          value={platformConfig?.payment.paydunyaSecretKey || ""}
                          onChange={(e) => updateConfig("payment", "paydunyaSecretKey", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Webhook Secret</Label>
                        <Input
                          type="password"
                          placeholder="whsec_..."
                          value={platformConfig?.payment.paydunyaWebhookSecret || ""}
                          onChange={(e) => updateConfig("payment", "paydunyaWebhookSecret", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Mode</Label>
                        <Select
                          value={platformConfig?.payment.paydunyaMode || "sandbox"}
                          onValueChange={(value) => updateConfig("payment", "paydunyaMode", value)}
                        >
                          <SelectContent>
                            <SelectItem value="sandbox">Sandbox (Test)</SelectItem>
                            <SelectItem value="live">Production</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          URL Webhook: {platformConfig?.payment.paydunyaMode === "sandbox"
                            ? "https://app.paydunya.com/sandbox-api"
                            : "https://app.paydunya.com/api"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <Button
                  onClick={() => handleSaveConfig("payment")}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Sauvegarder Paiements
                </Button>
              </CardContent>
            </Card>
            
            {/* General Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Paramètres généraux</CardTitle>
                    <CardDescription>Configuration globale de la plateforme</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom de la plateforme</Label>
                    <Input
                      value={platformConfig?.general.platformName || ""}
                      onChange={(e) => updateConfig("general", "platformName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email support</Label>
                    <Input
                      type="email"
                      placeholder="support@livepay.tech"
                      value={platformConfig?.general.supportEmail || ""}
                      onChange={(e) => updateConfig("general", "supportEmail", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone support</Label>
                    <Input
                      placeholder="+221 77 000 00 00"
                      value={platformConfig?.general.supportPhone || ""}
                      onChange={(e) => updateConfig("general", "supportPhone", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Durée réservation (minutes)</Label>
                    <Input
                      type="number"
                      value={platformConfig?.general.defaultReservationMinutes || 30}
                      onChange={(e) => updateConfig("general", "defaultReservationMinutes", parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Devise par défaut</Label>
                    <Select
                      value={platformConfig?.general.defaultCurrency || "XOF"}
                      onValueChange={(v) => updateConfig("general", "defaultCurrency", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="XOF">XOF (Franc CFA)</SelectItem>
                        <SelectItem value="EUR">EUR (Euro)</SelectItem>
                        <SelectItem value="USD">USD (Dollar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Langue par défaut</Label>
                    <Select
                      value={platformConfig?.general.defaultLanguage || "fr"}
                      onValueChange={(v) => updateConfig("general", "defaultLanguage", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="wo">Wolof</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Mode maintenance</p>
                      <p className="text-xs text-muted-foreground">Désactive l'accès à la plateforme</p>
                    </div>
                    <Switch
                      checked={platformConfig?.general.maintenanceMode || false}
                      onCheckedChange={(checked) => updateConfig("general", "maintenanceMode", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Inscription activée</p>
                      <p className="text-xs text-muted-foreground">Permet aux nouveaux utilisateurs de s'inscrire</p>
                    </div>
                    <Switch
                      checked={platformConfig?.general.registrationEnabled !== false}
                      onCheckedChange={(checked) => updateConfig("general", "registrationEnabled", checked)}
                    />
                  </div>
                </div>
                
                <Button
                  onClick={() => handleSaveConfig("general")}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Sauvegarder Général
                </Button>
              </CardContent>
            </Card>
            
            {/* Notifications Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Bell className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Notifications</CardTitle>
                    <CardDescription>Configuration des canaux de notification</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications Email</p>
                      <p className="text-xs text-muted-foreground">Envoyer des emails aux entites</p>
                    </div>
                    <Switch
                      checked={platformConfig?.notifications.emailEnabled || false}
                      onCheckedChange={(checked) => updateConfig("notifications", "emailEnabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications SMS</p>
                      <p className="text-xs text-muted-foreground">Envoyer des SMS aux entites</p>
                    </div>
                    <Switch
                      checked={platformConfig?.notifications.smsEnabled || false}
                      onCheckedChange={(checked) => updateConfig("notifications", "smsEnabled", checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications Push</p>
                      <p className="text-xs text-muted-foreground">Notifications navigateur/mobile</p>
                    </div>
                    <Switch
                      checked={platformConfig?.notifications.pushEnabled || false}
                      onCheckedChange={(checked) => updateConfig("notifications", "pushEnabled", checked)}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Webhook Slack (optionnel)</Label>
                  <Input
                    placeholder="https://hooks.slack.com/services/..."
                    value={platformConfig?.notifications.slackWebhook || ""}
                    onChange={(e) => updateConfig("notifications", "slackWebhook", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recevoir les alertes importantes sur Slack
                  </p>
                </div>
                
                <Button
                  onClick={() => handleSaveConfig("notifications")}
                  disabled={isSaving}
                >
                  {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Sauvegarder Notifications
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-4">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Entites actifs (24/24)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {vendors
                      .filter(v => vendorConfigs.get(v.id)?.status === "active")
                      .map((vendor) => {
                        const config = vendorConfigs.get(vendor.id);
                        return (
                          <div key={vendor.id} className="flex items-center justify-between p-3 rounded-lg border bg-green-50 dark:bg-green-950/20">
                            <div>
                              <p className="font-medium">{vendor.businessName || vendor.firstName}</p>
                              <p className="text-xs text-muted-foreground">{vendor.email}</p>
                            </div>
                            <Badge className="bg-green-600">Actif 24/24</Badge>
                          </div>
                        );
                      })}
                    {vendors.filter(v => vendorConfigs.get(v.id)?.status === "active").length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun entite actif actuellement
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dernières Ventes payées</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {orders
                      .filter(o => o.status === "paid")
                      .slice(0, 10)
                      .map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium text-sm">{order.productName || "Produit"} x{order.quantity}</p>
                            <p className="text-xs text-muted-foreground">{order.clientPhone}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-green-600">{formatPrice(order.totalAmount)}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(order.createdAt, "HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Entity Dialog */}
      <CreateEntityDialog
        open={showCreateEntityDialog}
        onOpenChange={setShowCreateEntityDialog}
      />
    </div>
  );
}

// Create Entity Dialog Component
function CreateEntityDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    adminEmail: "",
    adminPassword: "",
    adminFirstName: "",
    adminLastName: "",
    phone: "",
    sector: "shop",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    const errors: string[] = [];

    if (!formData.businessName.trim()) {
      errors.push("Le nom de l'entreprise est requis");
    }

    if (!formData.adminEmail.trim()) {
      errors.push("L'email de l'administrateur est requis");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      errors.push("L'email n'est pas valide");
    }

    if (!formData.adminPassword) {
      errors.push("Le mot de passe est requis");
    } else if (formData.adminPassword.length < 6) {
      errors.push("Le mot de passe doit contenir au moins 6 caractères");
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.push("Le numéro de téléphone n'est pas valide");
    }

    if (errors.length > 0) {
      toast({
        title: "Erreur de validation",
        description: (
          <ul className="list-disc list-inside mt-2">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        ),
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);

      // Create entity
      const result = await createEntityWithAdmin({
        businessName: formData.businessName,
        adminEmail: formData.adminEmail,
        adminPassword: formData.adminPassword,
        adminFirstName: formData.adminFirstName || "Admin",
        adminLastName: formData.adminLastName,
        phone: formData.phone,
        sector: formData.sector as any,
      });

      toast({
        title: "Entité créée",
        description: `L'entité "${formData.businessName}" a été créée avec succès`,
      });

      // Open email client to send credentials
      sendWelcomeEmail(
        result.adminEmail,
        formData.businessName,
        result.temporaryPassword
      );

      toast({
        title: "Email envoyé",
        description: "Les identifiants ont été envoyés à l'administrateur",
      });

      onOpenChange(false);
      setFormData({
        businessName: "",
        adminEmail: "",
        adminPassword: "",
        adminFirstName: "",
        adminLastName: "",
        phone: "",
        sector: "shop",
      });

      // Reload page to update stats
      window.location.reload();

    } catch (error: any) {
      console.error("Error creating entity:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'entité",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle entité</DialogTitle>
          <DialogDescription>
            Créez une nouvelle entreprise avec son administrateur. Les identifiants seront envoyés par email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nom de l'entreprise *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Ex: Boutique Dakar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Secteur d'activité</Label>
              <Select
                value={formData.sector}
                onValueChange={(value) => setFormData({ ...formData, sector: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shop">E-commerce</SelectItem>
                  <SelectItem value="event">Événementiel</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                  <SelectItem value="admin">Administration</SelectItem>
                  <SelectItem value="delivery">Livraison</SelectItem>
                  <SelectItem value="telecom">Télécom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Email administrateur *</Label>
              <Input
                id="adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                placeholder="admin@entreprise.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminPassword">Mot de passe temporaire *</Label>
              <Input
                id="adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                placeholder="Min 6 caractères"
                minLength={6}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminFirstName">Prénom administrateur</Label>
              <Input
                id="adminFirstName"
                value={formData.adminFirstName}
                onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                placeholder="Ex: Mamadou"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adminLastName">Nom administrateur</Label>
              <Input
                id="adminLastName"
                value={formData.adminLastName}
                onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                placeholder="Ex: Diop"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+221 XX XXX XX XX"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Créer l'entité
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}





