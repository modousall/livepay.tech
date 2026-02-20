/**
 * Real-time Orders Hook
 * Provides live order updates with notifications
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { subscribeToOrders, type Order } from "@/lib/firebase";

interface UseRealtimeOrdersOptions {
  enableNotifications?: boolean;
  playSound?: boolean;
}

export function useRealtimeOrders(options: UseRealtimeOrdersOptions = {}) {
  const { enableNotifications = true, playSound = true } = options;
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Track previous order count for notifications
  const prevOrderCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);
  
  // Audio for new order notification
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    // Initialize audio (use a simple beep sound URL)
    if (playSound && typeof window !== 'undefined') {
      audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleA8VYKvb4Jh1LiMzc6PM2IhhFR4phdrc0oliJig2epXB0sOAbSclX4aovbihd18qOWCHqLuniHxRQkBlfo2nrpOGXkBLXnKNq6SFaE9JUWRofpd+bJGFYUxnYniLlHVlgGNMZWR4i5VudpRtUXB4go6Ea3SPYFhucX6GgW5wmGJddHV+gHdocJZkXXl7eoF0cX6VZGJ9fXp8b3F7lWRlgHx6fHFxe5NlZ4J7en1xcnqRZWiEe3p8cnN5kGZphXt6fHN0eI9naYZ7enxzdXeObWqHe3p7dHV2jG5riHt6e3V1dYttbIl7ent2dXSKbm2Je3p7d3Z0iG9uiXp6e3d2dIdvcIl6ent4dnWGcHGJeXp6eHd1hXFyiXl6enh4dIRyc4l5enp5eHODc3SJeXp6eXhzgnR1iXh5eXl5c4F1dol4eXl5eXKAdnaIdnh4eHlygHd4h3Z4eHh5cYB4eYd2eHh4eXGAeXmGdnh4eHhxgHp6hnV4eHh4cYB7eYV1d3d3d3CAe3qEdHZ2dnZvgHx6hHR2dnZ2bmCAfHqDc3V1dXVuYIB8eoRzdHR0dG5ggHx7hHNzc3NzbmGAfHuEc3Nzc3NuYYB8e4Ryc3Nzc25hgHx7gnJycnJybmKBfHuCcnJycnJuYoF8eoFxcXFxcW5jgXx6gXFxcXFxbmOBfHqBcXBwcHBuY4F8eoBwcHBwcG9kgXx6gHBwcHBwb2SBfHp/cG9vb29vZIF8en9vb29vb29kgX15f29vb29vb2WBfHl/b29vb29vZYJ8eX5ubm5ubm9lgn15fm5ubm5uZWWCfXl+bm5ubm5lZoJ8eX5tbW1tbWVmgn15fW1tbW1tZWeCfHl9bWxtbGxlZ4J8eX1sbGxsa2Vngn15fWxra2trZWeCfHl9bGtra2tlZ4N8eX1ra2tra2VognV0emtra2trZmiDdXN6amtra2pmZ4N1c3lqampqamZnh3ZzeWpqampqZmeHd3R5ampqampmZ4d3dHhoaWlpaWZnh3h0eGhpaWlpZmeHeHR4aGhoaGhmZ4h4dHdoaGhoaGdniHh0d2dnZ2dnZ2eIeHR3Z2dnZ2dnZ4h5dHdnZ2dnZ2dniHp1d2dnZ2dnZ2eIenV3Z2dnZ2dnZol6dXdmZmZmZmZmiXp1d2ZmZmZmZmaJe3V3ZmZmZmZmZol7dXdgYGBgYGZmiXt1eoL/');
    }
    
    return () => {
      audioRef.current = null;
    };
  }, [playSound]);
  
  // Notify for new orders
  const notifyNewOrder = useCallback((order: Order) => {
    // Play sound
    if (playSound && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    
    // Show toast notification
    if (enableNotifications) {
      toast({
        title: "🛒 Nouvelle commande!",
        description: `${order.productName || 'Produit'} x${order.quantity} - ${new Intl.NumberFormat('fr-FR').format(order.totalAmount)} FCFA`,
      });
    }
    
    // Browser notification
    if (enableNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('LivePay - Nouvelle commande!', {
        body: `${order.productName || 'Produit'} x${order.quantity}`,
        icon: '/icon-192.png',
        tag: `order-${order.id}`,
      });
    }
  }, [enableNotifications, playSound, toast]);
  
  // Request notification permissions
  useEffect(() => {
    if (enableNotifications && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enableNotifications]);
  
  // Subscribe to orders
  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const unsubscribe = subscribeToOrders(
      user.id,
      (newOrders) => {
        // Check for new orders (after initial load)
        if (!isInitialLoadRef.current && newOrders.length > prevOrderCountRef.current) {
          // Find the new order(s)
          const newOrder = newOrders[0];
          if (newOrder) {
            notifyNewOrder(newOrder);
          }
        }
        
        prevOrderCountRef.current = newOrders.length;
        isInitialLoadRef.current = false;
        setOrders(newOrders);
        setIsLoading(false);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );
    
    return () => {
      unsubscribe();
      isInitialLoadRef.current = true;
    };
  }, [user?.id, notifyNewOrder]);
  
  // Stats derived from orders
  const stats = {
    pending: orders.filter(o => o.status === "pending").length,
    reserved: orders.filter(o => o.status === "reserved").length,
    paid: orders.filter(o => o.status === "paid").length,
    expired: orders.filter(o => o.status === "expired").length,
    totalRevenue: orders.filter(o => o.status === "paid").reduce((sum, o) => sum + o.totalAmount, 0),
  };
  
  return {
    orders,
    stats,
    isLoading,
    error,
    recentOrders: orders.slice(0, 10),
  };
}
