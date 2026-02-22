/**
 * WABA Manager - Multi-WABA Support pour Wasender/Meta/Unipile
 * 
 * Gère les instances WhatsApp Business Account multiples par vendor
 * Architecture:
 * - 1 Vendor = 1 Numéro WhatsApp unique
 * - N Vendors = N Numéros = N Instances
 * - Redis cache pour les mappings phone → vendor
 * - Routing automatique des webhooks aux bons vendors
 */

import { logger } from "../logger";
import { WABAInstance, VendorConfig } from "../../shared/types";

// Cache strategies
type CacheStrategy = "redis" | "memory";

interface WABACache {
  phoneNumber: string;
  vendorId: string;
  wabaInstanceId: string;
  provider: "wasender" | "meta" | "unipile";
  wasenderInstanceId?: string;
  lastFetch: number;
}

/**
 * Service multi-WABA pour gérer les instances
 */
export class WABAManager {
  private cache: Map<string, WABACache>; // Memory cache as fallback
  private strategy: CacheStrategy;
  private redisClient?: any; // Redis client if available
  private ttl: number; // Cache TTL en secondes

  constructor(strategy: CacheStrategy = "redis", ttl: number = 3600) {
    this.cache = new Map();
    this.strategy = strategy;
    this.ttl = ttl;
    this.initRedis();
  }

  /**
   * Initialiser Redis si disponible
   */
  private initRedis(): void {
    if (this.strategy === "redis" && process.env.REDIS_URL) {
      try {
        const Redis = require("redis");
        this.redisClient = Redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: (retries: number) =>
              Math.min(retries * 50, 500),
          },
        });

        this.redisClient.on("error", (err: Error) => {
          logger.error("[WABA Manager] Redis error", { error: err.message });
          // Fallback to memory cache
          this.strategy = "memory";
        });

        this.redisClient.on("connect", () => {
          logger.info("[WABA Manager] Redis connected");
        });

        this.redisClient.connect();
      } catch (error) {
        logger.warn("[WABA Manager] Redis not available, using memory cache", {
          error:
            error instanceof Error ? error.message : "Unknown error",
        });
        this.strategy = "memory";
      }
    }
  }

  /**
   * Enregistrer une instance WABA
   * Appelé quand un vendor configure son numéro WhatsApp
   */
  async registerWABAInstance(
    wabaInstance: WABAInstance
  ): Promise<void> {
    const cacheKey = `waba:phone:${wabaInstance.phoneNumber}`;
    const instanceKey = `waba:instance:${wabaInstance.id}`;

    const cacheEntry: WABACache = {
      phoneNumber: wabaInstance.phoneNumber,
      vendorId: wabaInstance.vendorId,
      wabaInstanceId: wabaInstance.id,
      provider: wabaInstance.provider,
      wasenderInstanceId: wabaInstance.wasenderInstanceId,
      lastFetch: Date.now(),
    };

    try {
      if (this.strategy === "redis" && this.redisClient) {
        // Stocker le mapping phone → vendor
        await this.redisClient.setex(
          cacheKey,
          this.ttl,
          JSON.stringify(cacheEntry)
        );

        // Stocker l'instance complète pour les détails
        await this.redisClient.setex(
          instanceKey,
          this.ttl,
          JSON.stringify(wabaInstance)
        );

        logger.info("[WABA Manager] Registered instance in Redis", {
          vendorId: wabaInstance.vendorId,
          phone: wabaInstance.phoneNumber,
        });
      } else {
        // Memory fallback
        this.cache.set(cacheKey, cacheEntry);
        logger.info("[WABA Manager] Registered instance in memory", {
          vendorId: wabaInstance.vendorId,
          phone: wabaInstance.phoneNumber,
        });
      }
    } catch (error) {
      logger.error("[WABA Manager] Failed to register instance", {
        error:
          error instanceof Error ? error.message : "Unknown error",
        vendorId: wabaInstance.vendorId,
      });
      // Fallback to memory
      this.cache.set(cacheKey, cacheEntry);
    }
  }

  /**
   * Trouver le vendor par numéro de téléphone entrant
   * Utilisé dans les webhooks pour identifier le destinataire
   */
  async findVendorByPhoneNumber(
    phoneNumber: string
  ): Promise<{ vendorId: string; wabaInstance: WABAInstance } | null> {
    const cacheKey = `waba:phone:${phoneNumber}`;

    try {
      if (this.strategy === "redis" && this.redisClient) {
        // Chercher dans Redis
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          const cacheEntry: WABACache = JSON.parse(cached);
          const instanceKey = `waba:instance:${cacheEntry.wabaInstanceId}`;
          const instanceData = await this.redisClient.get(instanceKey);

          if (instanceData) {
            return {
              vendorId: cacheEntry.vendorId,
              wabaInstance: JSON.parse(instanceData) as WABAInstance,
            };
          }
        }
      } else {
        // Chercher dans memory cache
        const cached = this.cache.get(cacheKey);
        if (cached) {
          // Pour demo, retourner le cached (dans une vraie app, il faudrait récupérer
          // la complète instance depuis Firestore)
          return {
            vendorId: cached.vendorId,
            wabaInstance: {
              id: cached.wabaInstanceId,
              vendorId: cached.vendorId,
              phoneNumber: cached.phoneNumber,
              provider: cached.provider,
              wasenderInstanceId: cached.wasenderInstanceId,
              status: "connected",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          };
        }
      }

      // Not in cache - query Firestore (set cache for next time)
      const result = await this.findVendorInFirestore(phoneNumber);
      if (result) {
        await this.registerWABAInstance(result.wabaInstance);
      }
      return result;
    } catch (error) {
      logger.error("[WABA Manager] Error finding vendor by phone", {
        phone: phoneNumber,
        error:
          error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Trouver le vendor par Wasender instance ID
   * Utilisé dans les webhooks Wasender
   */
  async findVendorByWasenderInstanceId(
    instanceId: string
  ): Promise<{ vendorId: string; wabaInstance: WABAInstance } | null> {
    const cacheKey = `waba:wasender:${instanceId}`;

    try {
      if (this.strategy === "redis" && this.redisClient) {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          return {
            vendorId: data.vendorId,
            wabaInstance: data.wabaInstance,
          };
        }
      }

      // Query Firestore
      const result = await this.findVendorByWasenderInFirestore(instanceId);
      if (result && this.redisClient) {
        await this.redisClient.setex(
          cacheKey,
          this.ttl,
          JSON.stringify(result)
        );
      }
      return result;
    } catch (error) {
      logger.error("[WABA Manager] Error finding vendor by Wasender ID", {
        wasenderId: instanceId,
        error:
          error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }

  /**
   * Obtenir toutes les instances WABA pour un vendor
   */
  async getVendorWABAInstances(vendorId: string): Promise<WABAInstance[]> {
    const cacheKey = `waba:vendor:${vendorId}`;

    try {
      if (this.strategy === "redis" && this.redisClient) {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      // Query Firestore
      const instances = await this.getVendorWABAFromFirestore(vendorId);
      if (instances.length > 0 && this.redisClient) {
        await this.redisClient.setex(
          cacheKey,
          this.ttl,
          JSON.stringify(instances)
        );
      }
      return instances;
    } catch (error) {
      logger.error("[WABA Manager] Error getting vendor WABA instances", {
        vendorId,
        error:
          error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }

  /**
   * Invalider le cache pour un vendor
   * Appelé après une mise à jour de config
   */
  async invalidateVendorCache(vendorId: string): Promise<void> {
    try {
      if (this.strategy === "redis" && this.redisClient) {
        const pattern = `waba:vendor:${vendorId}`;
        const keys = await this.redisClient.keys(`${pattern}*`);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }

      logger.info("[WABA Manager] Cache invalidated for vendor", {
        vendorId,
      });
    } catch (error) {
      logger.error("[WABA Manager] Error invalidating cache", {
        vendorId,
        error:
          error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

/**
 * Placeholder pour requête Firestore
 * À implémenter selon votre setup Firebase
 */
private async findVendorInFirestore(
    phoneNumber: string
  ): Promise<{ vendorId: string; wabaInstance: WABAInstance } | null> {
    try {
      const { findWABAByPhoneNumber } = await import("./firebase-waba");
      const wabaInstance = await findWABAByPhoneNumber(phoneNumber);
      
      if (!wabaInstance) {
        return null;
      }

      return {
        vendorId: wabaInstance.vendorId,
        wabaInstance,
      };
    } catch (error) {
      logger.error("[WABA Manager] Firestore lookup error", { error });
      return null;
    }
  }

  /**
   * Placeholder pour requête Firestore par Wasender ID
   */
  private async findVendorByWasenderInFirestore(
    wasenderId: string
  ): Promise<{ vendorId: string; wabaInstance: WABAInstance } | null> {
    try {
      const { findWABAByWasenderInstanceId } = await import("./firebase-waba");
      const wabaInstance = await findWABAByWasenderInstanceId(wasenderId);
      
      if (!wabaInstance) {
        return null;
      }

      return {
        vendorId: wabaInstance.vendorId,
        wabaInstance,
      };
    } catch (error) {
      logger.error("[WABA Manager] Firestore lookup error", { error });
      return null;
    }
  }

  /**
   * Placeholder pour requête Firestore des instances vendor
   */
  private async getVendorWABAFromFirestore(
    vendorId: string
  ): Promise<WABAInstance[]> {
    try {
      const { getVendorWABAInstances } = await import("./firebase-waba");
      return await getVendorWABAInstances(vendorId);
    } catch (error) {
      logger.error("[WABA Manager] Firestore lookup error", { error });
      return [];
    }
  }

  /**
   * Fermer les connexions
   */
  async close(): Promise<void> {
    if (this.redisClient) {
      await this.redisClient.quit();
      logger.info("[WABA Manager] Redis connection closed");
    }
    this.cache.clear();
  }
}

// Export singleton instance
let wabaManager: WABAManager;

export function initWABAManager(
  strategy: CacheStrategy = "redis"
): WABAManager {
  if (!wabaManager) {
    wabaManager = new WABAManager(strategy);
  }
  return wabaManager;
}

export function getWABAManager(): WABAManager {
  if (!wabaManager) {
    wabaManager = new WABAManager();
  }
  return wabaManager;
}
