/**
 * Analytics Hook
 * Calculates and provides dashboard analytics from orders data
 */

import { useMemo } from "react";
import { startOfDay, subDays, format, isWithinInterval, startOfWeek, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import type { Order, Product } from "@/lib/firebase";

export interface DailyRevenue {
  date: string;
  shortDate: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  keyword: string;
  quantity: number;
  revenue: number;
}

export interface AnalyticsData {
  // Today's stats
  todayRevenue: number;
  todayOrders: number;
  todayPaidOrders: number;
  
  // Yesterday comparison
  yesterdayRevenue: number;
  revenueChange: number; // percentage
  
  // Conversion metrics
  conversionRate: number; // reserved -> paid percentage
  averageOrderValue: number;
  
  // Weekly stats
  weeklyRevenue: number;
  weeklyOrders: number;
  
  // Chart data
  dailyRevenue: DailyRevenue[];
  
  // Top products
  topProducts: TopProduct[];
  
  // Status breakdown
  statusBreakdown: {
    pending: number;
    reserved: number;
    paid: number;
    expired: number;
    cancelled: number;
  };
}

export function useAnalytics(orders: Order[], products: Product[]): AnalyticsData {
  return useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    
    // Helper to safely get Date from order
    const getOrderDate = (order: Order): Date => {
      if (order.createdAt instanceof Date) return order.createdAt;
      if (typeof order.createdAt === 'object' && 'toDate' in order.createdAt) {
        return (order.createdAt as any).toDate();
      }
      return new Date(order.createdAt as any);
    };

    // Filter orders by date
    const todayOrders = orders.filter(order => {
      const orderDate = getOrderDate(order);
      return orderDate >= todayStart;
    });
    
    const yesterdayOrders = orders.filter(order => {
      const orderDate = getOrderDate(order);
      return orderDate >= yesterdayStart && orderDate < todayStart;
    });
    
    const weekOrders = orders.filter(order => {
      const orderDate = getOrderDate(order);
      return orderDate >= weekStart;
    });
    
    // Today's metrics
    const todayPaidOrders = todayOrders.filter(o => o.status === "paid");
    const todayRevenue = todayPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    // Yesterday's metrics
    const yesterdayPaidOrders = yesterdayOrders.filter(o => o.status === "paid");
    const yesterdayRevenue = yesterdayPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    // Revenue change percentage
    const revenueChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : todayRevenue > 0 ? 100 : 0;
    
    // Weekly metrics
    const weekPaidOrders = weekOrders.filter(o => o.status === "paid");
    const weeklyRevenue = weekPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    // Conversion rate (reserved orders that became paid)
    const allReservedOrPaid = orders.filter(o => o.status === "paid" || o.status === "reserved" || o.status === "expired");
    const paidOrders = orders.filter(o => o.status === "paid");
    const conversionRate = allReservedOrPaid.length > 0 
      ? (paidOrders.length / allReservedOrPaid.length) * 100 
      : 0;
    
    // Average order value
    const averageOrderValue = paidOrders.length > 0
      ? paidOrders.reduce((sum, o) => sum + o.totalAmount, 0) / paidOrders.length
      : 0;
    
    // Daily revenue for the last 7 days
    const last7Days = eachDayOfInterval({
      start: subDays(todayStart, 6),
      end: todayStart,
    });
    
    const dailyRevenue: DailyRevenue[] = last7Days.map(day => {
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayOrders = orders.filter(order => {
        const orderDate = getOrderDate(order);
        return isWithinInterval(orderDate, { start: dayStart, end: dayEnd }) && order.status === "paid";
      });
      
      return {
        date: format(day, "yyyy-MM-dd"),
        shortDate: format(day, "EEE", { locale: fr }),
        revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        orders: dayOrders.length,
      };
    });
    
    // Top products by quantity sold
    const productSales = new Map<string, { quantity: number; revenue: number }>();
    paidOrders.forEach(order => {
      const existing = productSales.get(order.productId) || { quantity: 0, revenue: 0 };
      productSales.set(order.productId, {
        quantity: existing.quantity + order.quantity,
        revenue: existing.revenue + order.totalAmount,
      });
    });
    
    const topProducts: TopProduct[] = Array.from(productSales.entries())
      .map(([productId, stats]) => {
        const product = products.find(p => p.id === productId);
        return {
          productId,
          name: product?.name || "Produit inconnu",
          keyword: product?.keyword || "",
          quantity: stats.quantity,
          revenue: stats.revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
    
    // Status breakdown
    const statusBreakdown = {
      pending: orders.filter(o => o.status === "pending").length,
      reserved: orders.filter(o => o.status === "reserved").length,
      paid: orders.filter(o => o.status === "paid").length,
      expired: orders.filter(o => o.status === "expired").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
    };
    
    return {
      todayRevenue,
      todayOrders: todayOrders.length,
      todayPaidOrders: todayPaidOrders.length,
      yesterdayRevenue,
      revenueChange,
      conversionRate,
      averageOrderValue,
      weeklyRevenue,
      weeklyOrders: weekOrders.length,
      dailyRevenue,
      topProducts,
      statusBreakdown,
    };
  }, [orders, products]);
}
