/**
 * LivePay Cloud Functions - Main Entry Point (source)
 */
import { setGlobalOptions } from "firebase-functions/v2/options";
import "./firebase";
import {
  WASENDER_API_KEY,
  WASENDER_API_URL,
  WASENDER_INSTANCE_ID,
  WASENDER_WEBHOOK_SECRET,
} from "./secrets";

setGlobalOptions({
  secrets: [
    WASENDER_API_KEY,
    WASENDER_API_URL,
    WASENDER_INSTANCE_ID,
    WASENDER_WEBHOOK_SECRET,
  ],
});

// Export functions from services and admin
export { publicShop } from "./services/public-shop";
export {
  adminUpdateUserRole,
  adminToggleUserStatus,
  adminDeleteUser,
  adminDeleteEntity,
} from "./admin/superadmin";
