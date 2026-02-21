import { defineSecret } from "firebase-functions/params";

export const WASENDER_API_KEY = defineSecret("WASENDER_API_KEY");
export const WASENDER_API_URL = defineSecret("WASENDER_API_URL");
export const WASENDER_INSTANCE_ID = defineSecret("WASENDER_INSTANCE_ID");
export const WASENDER_WEBHOOK_SECRET = defineSecret("WASENDER_WEBHOOK_SECRET");
