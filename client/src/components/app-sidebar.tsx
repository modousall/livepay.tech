import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Settings, Shield, Crown, UsersRound, Clock, List, Ticket, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { getVendorConfig, isSuperAdmin, type VendorConfig } from "@/lib/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BUSINESS_PROFILES, type BusinessProfileKey, type PersonaModuleId } from "@/lib/business-profiles";
import Logo from "/logo.jpg";

const baseNavItems = [
  { title: "Tableau de bord", url: "/", icon: LayoutDashboard },
  // Parcours removed - not needed
  { title: "Equipe", url: "/entity-members", icon: UsersRound },
  { title: "Parametres", url: "/settings", icon: Settings },
];

const personaNavMap: Record<PersonaModuleId, { title: string; url: string; icon: any }> = {
  products: { title: "Catalogue", url: "/products", icon: Package },
  orders: { title: "Ventes", url: "/orders", icon: ShoppingCart },
  appointments: { title: "Calendrier", url: "/modules/appointments", icon: Clock },
  queue: { title: "File d'attente", url: "/modules/queue", icon: List },
  ticketing: { title: "Billetterie", url: "/modules/ticketing", icon: Ticket },
  interventions: { title: "Interventions", url: "/modules/interventions", icon: Wrench },
};

const adminItems = [{ title: "Admin", url: "/admin", icon: Shield }];
const superAdminItems = [{ title: "Super Admin", url: "/super-admin", icon: Crown }];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [vendorConfig, setVendorConfig] = useState<VendorConfig | null>(null);
  const entityId = user?.entityId || user?.id;

  useEffect(() => {
    const load = async () => {
      if (!entityId) return;
      const cfg = await getVendorConfig(entityId);
      setVendorConfig(cfg);
    };
    load();
  }, [entityId]);

  const isAdmin = (user as any)?.role === "admin";
  const isSuperAdminUser = user?.email ? isSuperAdmin(user.email) : false;
  const profileKey = (vendorConfig?.segment as BusinessProfileKey) || "shop";
  const profile = BUSINESS_PROFILES[profileKey] || BUSINESS_PROFILES.shop;

  const personaItems = useMemo(
    () =>
      profile.essentialModules
        .map((id) => personaNavMap[id])
        .filter(Boolean),
    [profileKey]
  );
  const displayNavItems = isSuperAdminUser ? [] : [...baseNavItems, ...personaItems];

  const initials = user
    ? `${(user.firstName || "")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase() || "U"
    : "U";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <img src={Logo} alt="LIVE TECH Logo" className="w-8 h-8 rounded-md object-cover shrink-0" />
          <span className="text-lg font-semibold tracking-tight">LIVE TECH</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {isSuperAdminUser ? "Super Admin" : `Profil: ${profile.label}`}
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {displayNavItems.map((item) => (
                <SidebarMenuItem key={`${item.title}-${item.url}`}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isSuperAdminUser && isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isSuperAdminUser && (
          <SidebarGroup>
            <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {superAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={location === item.url}>
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{isSuperAdminUser ? "Super Admin" : user?.firstName || user?.email || "Entite"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={() => logout()}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
