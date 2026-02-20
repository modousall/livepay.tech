import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./use-auth";

import {
  getOrders,
  createOrder,
  updateOrder,
  type Order,
  type OrderStatus,
} from "@/lib/firebase";

export function useOrders() {
  const { user } = useAuth();
  const entityId = user?.entityId || user?.id;
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ["orders", entityId],
    queryFn: () => (entityId ? getOrders(entityId) : Promise.resolve([])),
    enabled: !!entityId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Order, "id" | "createdAt" | "updatedAt" | "vendorId">) =>
      createOrder({ ...data, vendorId: entityId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Order>) =>
      updateOrder(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      updateOrder(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Computed stats
  const stats = {
    pending: orders.filter((o) => o.status === "pending").length,
    reserved: orders.filter((o) => o.status === "reserved").length,
    paid: orders.filter((o) => o.status === "paid").length,
    expired: orders.filter((o) => o.status === "expired").length,
    totalRevenue: orders
      .filter((o) => o.status === "paid")
      .reduce((sum, o) => sum + o.totalAmount, 0),
  };

  return {
    orders,
    stats,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
