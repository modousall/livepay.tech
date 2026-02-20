/**
 * Export Utilities
 * Functions for exporting data to CSV, Excel, etc.
 */

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Order, Product } from "@/lib/firebase";

/**
 * Export orders to CSV
 */
export function exportOrdersToCSV(orders: Order[], filename?: string): void {
  const headers = [
    "ID Commande",
    "Date",
    "Client",
    "Téléphone",
    "Produit",
    "Quantité",
    "Prix Unitaire",
    "Total",
    "Statut",
    "Méthode de Paiement",
    "Date de Paiement"
  ];
  
  const rows = orders.map(order => [
    order.id,
    format(order.createdAt, "dd/MM/yyyy HH:mm", { locale: fr }),
    order.clientName || "-",
    order.clientPhone || "-",
    order.productName || "-",
    order.quantity.toString(),
    order.unitPrice?.toString() || "-",
    order.totalAmount.toString(),
    translateStatus(order.status),
    order.paymentMethod || "-",
    order.paidAt ? format(order.paidAt, "dd/MM/yyyy HH:mm", { locale: fr }) : "-"
  ]);
  
  const csvContent = [
    headers.join(";"),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))
  ].join("\n");
  
  // Add BOM for Excel UTF-8 compatibility
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
  
  const defaultFilename = `commandes_${format(new Date(), "yyyy-MM-dd")}.csv`;
  downloadBlob(blob, filename || defaultFilename);
}

/**
 * Export products to CSV
 */
export function exportProductsToCSV(products: Product[], filename?: string): void {
  const headers = [
    "ID Produit",
    "Mot-clé",
    "Nom",
    "Prix",
    "Stock Total",
    "Stock Réservé",
    "Stock Disponible",
    "Actif",
    "Date de Création"
  ];
  
  const rows = products.map(product => [
    product.id,
    product.keyword,
    product.name,
    product.price.toString(),
    product.stock.toString(),
    product.reservedStock.toString(),
    (product.stock - product.reservedStock).toString(),
    product.active ? "Oui" : "Non",
    format(product.createdAt, "dd/MM/yyyy", { locale: fr })
  ]);
  
  const csvContent = [
    headers.join(";"),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))
  ].join("\n");
  
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
  
  const defaultFilename = `produits_${format(new Date(), "yyyy-MM-dd")}.csv`;
  downloadBlob(blob, filename || defaultFilename);
}

/**
 * Export analytics summary
 */
export function exportAnalyticsSummary(data: {
  period: string;
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
}): void {
  const lines = [
    `Rapport LivePay - ${data.period}`,
    "",
    "=== RÉSUMÉ ===",
    `Revenu total: ${formatPrice(data.totalRevenue)}`,
    `Commandes totales: ${data.totalOrders}`,
    `Commandes payées: ${data.paidOrders}`,
    `Taux de conversion: ${data.conversionRate.toFixed(1)}%`,
    `Panier moyen: ${formatPrice(data.averageOrderValue)}`,
    "",
    "=== TOP PRODUITS ===",
    ...data.topProducts.map((p, i) => 
      `${i + 1}. ${p.name} - ${p.quantity} vendus - ${formatPrice(p.revenue)}`
    )
  ];
  
  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `rapport_${format(new Date(), "yyyy-MM-dd")}.txt`);
}

/**
 * Helper: Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper: Translate order status
 */
function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    pending: "En attente",
    reserved: "Réservé",
    paid: "Payé",
    expired: "Expiré",
    cancelled: "Annulé",
  };
  return translations[status] || status;
}

/**
 * Helper: Format price
 */
function formatPrice(amount: number): string {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
}
