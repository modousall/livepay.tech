import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "./use-auth";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from "@/lib/firebase";

export function useProducts() {
  const { user } = useAuth();
  const entityId = user?.entityId || user?.id;
  const queryClient = useQueryClient();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products", entityId],
    queryFn: () => (entityId ? getProducts(entityId) : Promise.resolve([])),
    enabled: !!entityId,
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Product, "id" | "createdAt" | "shareCode" | "reservedStock" | "vendorId">) =>
      createProduct({ ...data, vendorId: entityId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Product>) =>
      updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  return {
    products,
    isLoading,
    error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
