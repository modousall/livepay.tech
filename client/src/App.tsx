import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./lib/queryClient";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing-simple"; // Version simplifiée LIVE TECH
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Orders from "@/pages/orders";
import EntityMembersPage from "@/pages/entity-members";
import Settings from "@/pages/settings";
import SuperAdmin from "@/pages/super-admin";
import ProductPublic from "@/pages/product-public";
import PrivacyPolicy from "@/pages/privacy";
import TermsOfService from "@/pages/terms";
import DataDeletion from "@/pages/data-deletion";
import { InstallPrompt } from "@/components/install-prompt";
import { AppFooter } from "@/components/app-footer";
import { isSuperAdmin } from "@/lib/firebase";

function AuthenticatedRouter() {
  const { user } = useAuth();
  const isSuperAdminUser = user?.email ? isSuperAdmin(user.email) : false;
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-50 flex items-center justify-between gap-4 p-2 border-b bg-background/80 backdrop-blur-md">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              {isSuperAdminUser ? (
                <>
                  <Route path="/" component={SuperAdmin} />
                  <Route path="/super-admin" component={SuperAdmin} />
                  <Route path="/:path*" component={SuperAdmin} />
                </>
              ) : (
                <>
                  <Route path="/" component={Dashboard} />
                  <Route path="/dashboard" component={Dashboard} />
                  <Route path="/conversations" component={Orders} />
                  <Route path="/scenarios" component={Products} />
                  <Route path="/agents" component={EntityMembersPage} />
                  <Route path="/settings" component={Settings} />
                  <Route path="/:path*" component={Dashboard} />
                </>
              )}
            </Switch>
          </main>
          {!isSuperAdminUser && <AppFooter />}
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Switch>
        <Route path="/p/:code" component={ProductPublic} />
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/data-deletion" component={DataDeletion} />
        <Route path="/login">
          {user ? <AuthenticatedRouter /> : <Login />}
        </Route>
        <Route>
          {user ? <AuthenticatedRouter /> : <Landing />}
        </Route>
      </Switch>
      {!user && <AppFooter />}
      <InstallPrompt />
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <AppRouter />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
