import { createResourceCallbacks } from "./createResourceCallbacks";

export const notificationsCallbacks = createResourceCallbacks({
  resource: "notifications",
  supportsSoftDelete: true,
});
