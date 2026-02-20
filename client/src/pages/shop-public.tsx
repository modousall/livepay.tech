import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { MessageCircle, Store, ShoppingBag } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getPublicProductsByVendor,
  getUserProfile,
  getVendorConfig,
  type Product,
  type UserProfile,
  type VendorConfig,
} from "@/lib/firebase";

export default function ShopPublic() {
  const params = useParams<{ vendorId: string }>();
  const vendorId = params.vendorId;

  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendor, setVendor] = useState<UserProfile | null>(null);
  const [config, setConfig] = useState<VendorConfig | null>(null);

  useEffect(() => {
    if (!vendorId) return;
    const run = async () => {
      try {
        setIsLoading(true);
        const [list, v, c] = await Promise.all([
          getPublicProductsByVendor(vendorId),
          getUserProfile(vendorId),
          getVendorConfig(vendorId),
        ]);
        setProducts(list);
        setVendor(v);
        setConfig(c);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [vendorId]);

  const vendorName = useMemo(
    () => vendor?.businessName || vendor?.firstName || config?.businessName || "Boutique LivePay",
    [vendor, config]
  );

  const cleanPhone = (vendor?.phone || config?.mobileMoneyNumber || "").replace(/\D/g, "");

  const orderOnWhatsApp = (keyword: string) => {
    if (!cleanPhone) return;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(keyword)}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Store className="w-6 h-6 text-green-600" />
        <div>
          <h1 className="text-2xl font-bold">{vendorName}</h1>
          <p className="text-sm text-muted-foreground">Boutique en ligne</p>
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="p-10 text-center">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">Aucun produit disponible</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const code = p.shareCode || p.id;
            const stock = Math.max(0, (p.stock || 0) - (p.reservedStock || 0));
            return (
              <Card key={p.id} className="overflow-hidden">
                <Link href={`/p/${code}`}>
                  <div className="h-52 bg-muted">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ShoppingBag className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold truncate">{p.name}</p>
                    <Badge variant="outline">{p.keyword}</Badge>
                  </div>
                  <p className="text-green-600 font-bold">{p.price.toLocaleString("fr-FR")} FCFA</p>
                  <p className="text-xs text-muted-foreground">Stock: {stock}</p>
                  {p.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>
                  ) : null}
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href={`/p/${code}`}>Voir</Link>
                    </Button>
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => orderOnWhatsApp(p.keyword)}
                      disabled={!cleanPhone}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Commander
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
