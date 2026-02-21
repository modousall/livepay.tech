import { onCall, HttpsError } from "firebase-functions/v2/https";
import { auth, db } from "../firebase";

const SUPER_ADMIN_EMAILS = new Set([
  "contact@livepay.tech",
  "ms@coinhub.africa",
]);

function assertSuperAdmin(email?: string | null) {
  if (!email || !SUPER_ADMIN_EMAILS.has(email.toLowerCase())) {
    throw new HttpsError("permission-denied", "Super admin required.");
  }
}

export const adminUpdateUserRole = onCall(async (request) => {
  const email = request.auth?.token?.email as string | undefined;
  assertSuperAdmin(email);
  const { userId, role } = request.data || {};
  if (!userId || !role) {
    throw new HttpsError("invalid-argument", "userId and role are required.");
  }
  await db.collection("users").doc(String(userId)).update({
    role,
    updatedAt: new Date(),
  });
  return { ok: true };
});

export const adminToggleUserStatus = onCall(async (request) => {
  const email = request.auth?.token?.email as string | undefined;
  assertSuperAdmin(email);
  const { userId, suspended } = request.data || {};
  if (!userId || typeof suspended !== "boolean") {
    throw new HttpsError("invalid-argument", "userId and suspended are required.");
  }
  await db.collection("users").doc(String(userId)).update({
    suspended,
    updatedAt: new Date(),
  });
  return { ok: true };
});

export const adminDeleteUser = onCall(async (request) => {
  const email = request.auth?.token?.email as string | undefined;
  assertSuperAdmin(email);
  const { userId } = request.data || {};
  if (!userId) {
    throw new HttpsError("invalid-argument", "userId is required.");
  }
  const uid = String(userId);
  await db.collection("users").doc(uid).delete();
  try {
    await auth.deleteUser(uid);
  } catch (err) {
    console.error("[AdminDeleteUser] Auth delete failed:", err);
  }
  return { ok: true };
});

async function deleteByQuery(collection: string, field: string, value: string) {
  const snap = await db.collection(collection).where(field, "==", value).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snap.size;
}

export const adminDeleteEntity = onCall(async (request) => {
  const email = request.auth?.token?.email as string | undefined;
  assertSuperAdmin(email);
  const { entityId } = request.data || {};
  if (!entityId) {
    throw new HttpsError("invalid-argument", "entityId is required.");
  }
  const id = String(entityId);

  // Delete related docs
  await deleteByQuery("vendorConfigs", "vendorId", id);
  await deleteByQuery("products", "vendorId", id);
  await deleteByQuery("orders", "vendorId", id);
  await deleteByQuery("clients", "vendorId", id);
  await deleteByQuery("liveSessions", "vendorId", id);
  await deleteByQuery("invoices", "vendorId", id);

  // Delete users linked to entityId
  const usersSnap = await db.collection("users").where("entityId", "==", id).get();
  if (!usersSnap.empty) {
    const batch = db.batch();
    for (const doc of usersSnap.docs) {
      batch.delete(doc.ref);
      try {
        await auth.deleteUser(doc.id);
      } catch (err) {
        console.error("[AdminDeleteEntity] Auth delete failed:", doc.id, err);
      }
    }
    await batch.commit();
  }

  // Delete entity doc
  await db.collection("entities").doc(id).delete();
  return { ok: true };
});
