import { useEffect, useMemo, useState } from "react";
import { useRoute } from "wouter";
import { Download, Printer, Ticket, Store, Phone, Share2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrderByReceiptToken, getProduct, getUserProfile, updateOrder, type Order, type Product, type UserProfile } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

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
    if (!vendor) return "Entite";
    return vendor.businessName || [vendor.firstName, vendor.lastName].filter(Boolean).join(" ") || "Entite";
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
    ctx.fillText("Infos entite", 60, y);
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

  const sendTicketToClient = async () => {
    if (!order || !product) return;

    setIsSending(true);
    try {
      // Generate image
      const canvas = document.createElement("canvas");
      canvas.width = 800;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw ticket
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#111827";
      ctx.font = "bold 40px sans-serif";
      ctx.fillText("E-TICKET / RECU", 40, 60);

      ctx.font = "24px sans-serif";
      ctx.fillStyle = "#374151";
      ctx.fillText(`Commande: #${order.id}`, 40, 100);
      ctx.fillText(`Date: ${ticketDate}`, 40, 130);

      let y = 180;
      if (product?.imageUrl) {
        const img = await loadImage(product.imageUrl);
        if (img) {
          ctx.drawImage(img, 40, y, 200, 200);
        }
      }

      ctx.fillStyle = "#111827";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText(order.productName || product.name || "Produit", 260, y + 40);
      ctx.font = "22px sans-serif";
      ctx.fillStyle = "#374151";
      ctx.fillText(`Code: ${product.keyword || "-"}`, 260, y + 80);
      ctx.fillText(`Quantite: ${order.quantity}`, 260, y + 115);
      ctx.fillText(`Montant: ${formatAmount(order.totalAmount)}`, 260, y + 150);

      y = 480;
      ctx.fillStyle = "#111827";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("Infos entite", 40, y);
      ctx.font = "22px sans-serif";
      ctx.fillStyle = "#374151";
      ctx.fillText(vendorName, 40, y + 40);
      ctx.fillText(vendor?.phone || "-", 40, y + 70);

      ctx.fillStyle = "#111827";
      ctx.font = "bold 26px sans-serif";
      ctx.fillText("Statut: PAYE", 40, y + 130);
      ctx.font = "18px monospace";
      ctx.fillStyle = "#1f2937";
      ctx.fillText(`Recu genere le ${ticketDate}`, 40, y + 160);

      ctx.fillStyle = "#6b7280";
      ctx.font = "18px sans-serif";
      ctx.fillText("Document genere automatiquement par LivePay.", 40, 950);

      // Convert to blob and download
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `eticket-${order.id}.png`, { type: "image/png" });

        // Web Share API (mobile)
        if (navigator.share && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: "E-Ticket",
              text: `Votre e-ticket pour ${order.productName}`,
              files: [file],
            });
            toast({ title: "Ticket envoyé", description: "Partage réussi" });
          } catch (err) {
            console.error("Share error:", err);
          }
        } else {
          // Desktop fallback - download + WhatsApp
          const link = document.createElement("a");
          link.href = canvas.toDataURL("image/png");
          link.download = `eticket-${order.id}.png`;
          link.click();

          // WhatsApp with short message
          const cleanPhone = order.clientPhone.replace(/[^0-9]/g, "");
          const message = `🎫 *E-Ticket*\n\nCommande: #${order.id}\nProduit: ${order.productName}\nMontant: ${formatAmount(order.totalAmount)}\n\n✅ Le ticket a été téléchargé. Vérifiez vos fichiers.`;
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");

          toast({
            title: "Ticket téléchargé",
            description: "Envoyez le fichier via WhatsApp",
          });
        }

        // Update order
        await updateOrder(order.id, {
          status: "paid",
          paymentProof: `eticket-${order.id}.png`,
        });
      }, "image/png");
    } catch (err) {
      console.error("Error sending ticket:", err);
      toast({ title: "Erreur", description: "Impossible d'envoyer le ticket", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
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
              <Button onClick={sendTicketToClient} disabled={isSending} className="gap-2 bg-green-600 hover:bg-green-700">
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {isSending ? "Envoi..." : "Envoyer au client"}
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
