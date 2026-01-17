import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DiningMode = "delivery" | "pickup";

export interface LocationInfo {
  address: string;
  latitude: number;
  longitude: number;
  plusCode?: string;
}

export interface ScheduledTime {
  date: Date;
  label: string; // e.g., "Today, 2:30 PM"
}

interface DiningModeState {
  // Current dining mode
  mode: DiningMode;

  // Delivery location
  deliveryLocation: LocationInfo | null;

  // Pickup location (selected outlet)
  pickupOutletId: string | null;
  pickupOutletName: string | null;

  // Scheduling
  isScheduled: boolean;
  scheduledTime: ScheduledTime | null;

  // Actions
  setMode: (mode: DiningMode) => void;
  setDeliveryLocation: (location: LocationInfo) => void;
  setPickupOutlet: (outletId: string, outletName: string) => void;
  clearPickupOutlet: () => void;
  setScheduledTime: (time: ScheduledTime | null) => void;
  setIsScheduled: (scheduled: boolean) => void;
  clearSchedule: () => void;
  reset: () => void;
}

const initialState = {
  mode: "delivery" as DiningMode,
  deliveryLocation: null,
  pickupOutletId: null,
  pickupOutletName: null,
  isScheduled: false,
  scheduledTime: null,
};

export const useDiningModeStore = create<DiningModeState>()(
  persist(
    (set) => ({
      ...initialState,

      setMode: (mode) => set({ mode }),

      setDeliveryLocation: (location) => set({ deliveryLocation: location }),

      setPickupOutlet: (outletId, outletName) =>
        set({
          pickupOutletId: outletId,
          pickupOutletName: outletName,
          mode: "pickup",
        }),

      clearPickupOutlet: () => set({ pickupOutletId: null, pickupOutletName: null }),

      setScheduledTime: (time) =>
        set({
          scheduledTime: time,
          isScheduled: time !== null,
        }),

      setIsScheduled: (scheduled) => set({ isScheduled: scheduled }),

      clearSchedule: () => set({ scheduledTime: null, isScheduled: false }),

      reset: () => set(initialState),
    }),
    {
      name: "dining-mode-storage",
      partialize: (state) => ({
        mode: state.mode,
        deliveryLocation: state.deliveryLocation,
        pickupOutletId: state.pickupOutletId,
        pickupOutletName: state.pickupOutletName,
      }),
    },
  ),
);

// Selector hooks for common patterns
export const useCurrentDiningMode = () => useDiningModeStore((state) => state.mode);
export const useIsDeliveryMode = () => useDiningModeStore((state) => state.mode === "delivery");
export const useIsPickupMode = () => useDiningModeStore((state) => state.mode === "pickup");
