import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { MessageCircle, Package, Phone, Sparkles } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type PublicProduct = {
  id: string;
  name: string;
  keyword: string;
  description?: string;
  imageUrl?: string;
  price: number;
  originalPrice?: number;
  active?: boolean;
  stock?: number;
  reservedStock?: number;
  category?: string;
};

type PublicShop = {
  entityId: string;
  name: string;
  phone?: string;
  segment?: string;
  businessName?: string;
  products: PublicProduct[];
};

function getEntityIdFromPath(path: string): string | null {
  const match = path.match(/^\/shop\/([^/]+)\/*/i);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function PublicShopPage() {
  const [location] = useLocation();
  const entityId = useMemo(() => getEntityIdFromPath(location), [location]);
  const [data, setData] = useState<PublicShop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const categories = useMemo(() => {
    const list = (data?.products || [])
      .map((p) => (p.category || "").trim())
      .filter(Boolean);
    return Array.from(new Set(list));
  }, [data]);

  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    if (categoryFilter === "all") return data.products;
    return data.products.filter((p) => (p.category || "") === categoryFilter);
  }, [data, categoryFilter]);

  useEffect(() => {
    const load = async () => {
      if (!entityId) {
        setError("Catalogue introuvable.");
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch(`/api/public-shop?entityId=${encodeURIComponent(entityId)}`);
        if (!res.ok) throw new Error("Impossible de charger le catalogue.");
        const payload = (await res.json()) as PublicShop;
        setData(payload);
      } catch (err: any) {
        setError(err?.message || "Erreur lors du chargement.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [entityId]);

  const heroTitle = data?.businessName || data?.name || "Catalogue";
  const waPhone = data?.phone?.replace(/\D/g, "");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.15),transparent_55%),radial-gradient(circle_at_top_right,rgba(14,116,144,0.2),transparent_55%),linear-gradient(180deg,rgba(10,10,10,0.95),rgba(10,10,10,0.98))] text-white">
      <header className="px-6 md:px-12 pt-10 pb-8">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 text-sm text-white/70">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            Catalogue public sans inscription
          </div>
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
              {heroTitle}
            </h1>
            <p className="text-white/70 max-w-2xl">
              Découvrez les produits, prix et codes WhatsApp. Envoyez simplement le code du produit pour commander.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {waPhone ? (
              <Button
                asChild
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
              >
                <a
                  href={`https://wa.me/${waPhone}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Commander sur WhatsApp
                </a>
              </Button>
            ) : (
              <Button variant="outline" className="border-white/20 text-white/70" disabled>
                <Phone className="w-4 h-4 mr-2" />
                Numéro WhatsApp indisponible
              </Button>
            )}
            <Badge className="bg-white/10 text-white/70 border border-white/10">
              Codes produits disponibles
            </Badge>
          </div>
        </div>
      </header>

      <main className="px-6 md:px-12 pb-16">
        <div className="max-w-6xl mx-auto">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <Button
                variant={categoryFilter === "all" ? "default" : "outline"}
                className={categoryFilter === "all" ? "bg-white text-black" : "border-white/20 text-white/70"}
                onClick={() => setCategoryFilter("all")}
              >
                Tout
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? "default" : "outline"}
                  className={categoryFilter === cat ? "bg-white text-black" : "border-white/20 text-white/70"}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-white/5 border-white/10 p-4">
                  <Skeleton className="h-40 w-full mb-4" />
                  <Skeleton className="h-5 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="bg-white/5 border-white/10 p-6 text-white/80">
              {error}
            </Card>
          ) : (
            <>
              {filteredProducts.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const price = product.price?.toLocaleString("fr-FR");
                    const original = product.originalPrice?.toLocaleString("fr-FR");
                    return (
                      <Card key={product.id} className="bg-white/5 border-white/10 overflow-hidden">
                        <div className="relative h-44 bg-white/10">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="w-10 h-10 text-white/20" />
                            </div>
                          )}
                          {product.keyword ? (
                            <Badge className="absolute top-3 left-3 bg-black/60 text-white">
                              {product.keyword}
                            </Badge>
                          ) : null}
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                          {product.category ? (
                            <Badge className="bg-white/10 text-white/60 w-fit">
                              {product.category}
                            </Badge>
                          ) : null}
                          {product.description ? (
                            <p className="text-sm text-white/60 line-clamp-2">{product.description}</p>
                          ) : null}
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-semibold text-emerald-300">
                              {price} FCFA
                            </span>
                            {product.originalPrice && product.originalPrice > product.price ? (
                              <span className="text-sm text-white/40 line-through">
                                {original} FCFA
                              </span>
                            ) : null}
                          </div>
                          {waPhone && product.keyword ? (
                            <Button
                              asChild
                              className="w-full mt-2 bg-white text-black hover:bg-white/90"
                            >
                              <a
                                href={`https://wa.me/${waPhone}?text=${encodeURIComponent(product.keyword)}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Envoyer le code {product.keyword}
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-white/5 border-white/10 p-8 text-center text-white/70">
                  Aucun produit disponible pour le moment.
                </Card>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
