import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { Download, Printer, Ticket, Store, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrderByReceiptToken, getProduct, getUserProfile, type Order, type Product, type UserProfile } from "@/lib/firebase";

function formatAmount(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Number(amount || 0))} FCFA`;
}

async function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export default function ETicketPage() {
  const [, params] = useRoute("/eticket/:token");
  const token = params?.token || "";

  const [order, setOrder] = useState<Order | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setLoading(false);
        setError("Ticket introuvable.");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const orderData = await getOrderByReceiptToken(token);
        if (!orderData) {
          setError("Ticket invalide ou expire.");
          setLoading(false);
          return;
        }
        setOrder(orderData);

        const [productData, vendorData] = await Promise.all([
          orderData.productId ? getProduct(orderData.productId) : Promise.resolve(null),
          getUserProfile(orderData.vendorId),
        ]);
        setProduct(productData);
        setVendor(vendorData);
      } catch (e: any) {
        setError(e?.message || "Erreur de chargement du ticket.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [token]);

  const vendorName = useMemo(() => {
    if (!vendor) return "Vendeur";
    return vendor.businessName || [vendor.firstName, vendor.lastName].filter(Boolean).join(" ") || "Vendeur";
  }, [vendor]);

  const ticketDate = useMemo(() => {
    const d = order?.paidAt || order?.updatedAt || order?.createdAt;
    if (!d) return "-";
    return d.toLocaleString("fr-FR");
  }, [order]);

  const downloadPng = async () => {
    if (!order) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1520;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 54px sans-serif";
    ctx.fillText("E-TICKET / RECU", 60, 90);

    ctx.font = "32px sans-serif";
    ctx.fillStyle = "#374151";
    ctx.fillText(`Commande: #${order.id}`, 60, 150);
    ctx.fillText(`Date: ${ticketDate}`, 60, 198);

    let y = 280;
    if (product?.imageUrl) {
      const img = await loadImage(product.imageUrl);
      if (img) {
        ctx.drawImage(img, 60, y, 300, 300);
      }
    }

    ctx.fillStyle = "#111827";
    ctx.font = "bold 40px sans-serif";
    ctx.fillText(order.productName || product?.name || "Produit", 390, y + 60);
    ctx.font = "30px sans-serif";
    ctx.fillStyle = "#374151";
    ctx.fillText(`Code: ${product?.keyword || "-"}`, 390, y + 110);
    ctx.fillText(`Quantite: ${order.quantity}`, 390, y + 160);
    ctx.fillText(`Montant: ${formatAmount(order.totalAmount)}`, 390, y + 210);

    y = 690;
    ctx.fillStyle = "#111827";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("Infos vendeur", 60, y);
    ctx.font = "30px sans-serif";
    ctx.fillStyle = "#374151";
    ctx.fillText(vendorName, 60, y + 52);
    ctx.fillText(vendor?.phone || "-", 60, y + 98);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("Lien ticket", 60, y + 190);
    ctx.font = "24px monospace";
    ctx.fillStyle = "#1f2937";
    ctx.fillText(`${window.location.origin}/eticket/${token}`, 60, y + 234);

    ctx.fillStyle = "#6b7280";
    ctx.font = "24px sans-serif";
    ctx.fillText("Document genere automatiquement par LivePay.", 60, 1450);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `eticket-${order.id}.png`;
    link.click();
  };

  const printPdf = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-muted/20 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-600">{error}</CardContent>
          </Card>
        ) : order ? (
          <>
            <Card className="print:shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  E-ticket / Recu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Commande</p>
                    <p className="font-semibold">#{order.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-semibold">{ticketDate}</p>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <p className="font-semibold text-lg">{order.productName || product?.name || "Produit"}</p>
                  <p className="text-sm text-muted-foreground">Code: {product?.keyword || "-"}</p>
                  <p className="text-sm">Quantite: {order.quantity}</p>
                  <p className="text-xl font-bold">{formatAmount(order.totalAmount)}</p>
                </div>

                <div className="rounded-lg border p-4 space-y-2">
                  <p className="font-medium flex items-center gap-2"><Store className="h-4 w-4" /> {vendorName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4" /> {vendor?.phone || "-"}</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-3 print:hidden">
              <Button onClick={downloadPng} className="gap-2">
                <Download className="h-4 w-4" />
                Telecharger PNG
              </Button>
              <Button variant="outline" onClick={printPdf} className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimer / PDF
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
