import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { Radio, Mail, Lock, User, Building, Phone, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { BUSINESS_PROFILE_ORDER, BUSINESS_PROFILES, type BusinessProfileKey } from "@/lib/business-profiles";

export default function Register() {
  const [, navigate] = useLocation();
  const { register, isRegistering, registerError } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    businessName: "",
    phone: "",
    segment: "shop" as BusinessProfileKey,
  });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectedProfile = BUSINESS_PROFILES[formData.segment];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Email et mot de passe sont requis");
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        businessName: formData.businessName || undefined,
        phone: formData.phone || undefined,
        businessType: formData.segment,
        segment: formData.segment,
      });
      navigate("/modules");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'inscription");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Radio className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LivePay</span>
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-4xl p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Creer un compte professionnel</h1>
            <p className="text-muted-foreground">
              Choisissez votre profil metier pour activer les modules adaptes a votre activite.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {(error || registerError) && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error || registerError?.message}
              </div>
            )}

            <div className="space-y-3">
              <Label>Profil metier</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {BUSINESS_PROFILE_ORDER.map((profileKey) => {
                  const profile = BUSINESS_PROFILES[profileKey];
                  const active = formData.segment === profileKey;
                  return (
                    <button
                      key={profileKey}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, segment: profileKey }))}
                      className={`text-left rounded-lg border p-3 transition ${
                        active ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm">{profile.label}</p>
                        {active && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{profile.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border p-4 bg-muted/20">
              <p className="text-sm font-medium mb-2">Modules actives pour ce profil</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {selectedProfile.highlights.map((item) => (
                  <div key={item} className="text-xs rounded-md bg-background border px-2 py-1">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prenom</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Prenom"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isRegistering}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Nom"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isRegistering}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Nom de la structure</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="Ma structure"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isRegistering}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telephone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+221 77 123 45 67"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isRegistering}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={isRegistering}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={isRegistering}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10"
                    required
                    disabled={isRegistering}
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isRegistering}>
              {isRegistering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Inscription...
                </>
              ) : (
                <>
                  Activer ma plateforme
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Deja un compte ? </span>
            <a href="/login" className="text-primary hover:underline font-medium">
              Se connecter
            </a>
          </div>
        </Card>
      </main>
    </div>
  );
}
