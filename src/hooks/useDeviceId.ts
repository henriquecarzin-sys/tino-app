import { useState } from "react";
import { getOrCreateDeviceId } from "../lib/deviceId";

export function useDeviceId(): string {
  const [deviceId] = useState(() => getOrCreateDeviceId());
  return deviceId;
}
