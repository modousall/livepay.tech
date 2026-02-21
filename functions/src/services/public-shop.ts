import { onRequest } from "firebase-functions/v2/https";
import { db } from "../firebase";

type PublicProduct = {
  id: string;
  name?: string;
  keyword?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  originalPrice?: number;
  active?: boolean;
  stock?: number;
  reservedStock?: number;
};

export const publicShop = onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ message: "Method not allowed" });
    return;
  }

  try {
    const entityId = String(req.query.entityId || "").trim();
    if (!entityId) {
      res.status(400).json({ message: "Missing entityId" });
      return;
    }

    const entitySnap = await db.collection("entities").doc(entityId).get();
    if (!entitySnap.exists) {
      res.status(404).json({ message: "Entity not found" });
      return;
    }

    const entity = entitySnap.data() || {};
    const ownerId = String(entity.ownerId || "");

    let ownerPhone: string | undefined;
    let businessName: string | undefined;
    if (ownerId) {
      const ownerSnap = await db.collection("users").doc(ownerId).get();
      if (ownerSnap.exists) {
        const owner = ownerSnap.data() || {};
        ownerPhone = owner.phone ? String(owner.phone) : undefined;
        businessName = owner.businessName ? String(owner.businessName) : undefined;
      }
    }

    const vendorCfgSnap = await db
      .collection("vendorConfigs")
      .where("vendorId", "==", entityId)
      .limit(1)
      .get();
    const vendorCfg = vendorCfgSnap.empty ? {} : vendorCfgSnap.docs[0].data();

    const productsSnap = await db
      .collection("products")
      .where("vendorId", "==", entityId)
      .limit(200)
      .get();

    const products = productsSnap.docs
      .map((doc) => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          name: data.name,
          keyword: data.keyword,
          description: data.description,
          imageUrl: data.imageUrl,
          price: data.price,
          originalPrice: data.originalPrice,
          active: data.active,
          stock: data.stock,
          reservedStock: data.reservedStock,
        } as PublicProduct;
      })
      .filter((p) => p.active === true);

    res.status(200).json({
      entityId,
      name: String(entity.name || ""),
      businessName,
      segment: (vendorCfg as any).segment,
      phone: (vendorCfg as any).mobileMoneyNumber || ownerPhone,
      products,
    });
  } catch (error) {
    console.error("[PublicShop] Error:", error);
    res.status(500).json({ message: "Internal error" });
  }
});
