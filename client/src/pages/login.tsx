import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "/logo.jpg";

export default function Login() {
  const [, navigate] = useLocation();
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Clear error when component mounts or when user starts typing
  useEffect(() => {
    setError("");
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    try {
      await login({ email, password });
      navigate("/");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Erreur de connexion. Vérifiez vos identifiants.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <a href="/" className="flex items-center gap-2">
            <img src={Logo} alt="LIVE TECH Logo" className="w-10 h-10 rounded-md object-cover" />
            <span className="text-lg font-semibold tracking-tight">LIVE TECH</span>
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Connexion</h1>
            <p className="text-muted-foreground">
              Accédez à votre espace LIVE TECH
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoggingIn}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Pas encore de compte ? </span>
            <a href="mailto:contact@livepay.tech?subject=Demande%20d%27acc%C3%A8s%20LIVE%20TECH" className="text-primary hover:underline font-medium">
              Demander un accès
            </a>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 LIVE TECH. Tous droits réservés.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="/privacy" className="hover:text-foreground transition-colors">Confidentialité</a>
            <span>•</span>
            <a href="/terms" className="hover:text-foreground transition-colors">CGU</a>
            <span>•</span>
            <a href="mailto:contact@livepay.tech" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

