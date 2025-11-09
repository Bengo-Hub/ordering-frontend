import type { LatLngTuple } from "leaflet";
import { create } from "zustand";

const BUSIA_CENTER: LatLngTuple = [-0.0607, 34.2855];
const BUSIA_LABEL = "Busia Township";

type CustomerLocationState = {
  defaultLocation: LatLngTuple;
  defaultLabel: string;
  customLocation: LatLngTuple | null;
  customLabel: string | null;
  setDefaultLocation: (coords: LatLngTuple, label?: string) => void;
  setCustomLocation: (coords: LatLngTuple | null, label?: string | null) => void;
  clearCustomLocation: () => void;
};

export const useCustomerLocationStore = create<CustomerLocationState>((set) => ({
  defaultLocation: BUSIA_CENTER,
  defaultLabel: BUSIA_LABEL,
  customLocation: null,
  customLabel: null,
  setDefaultLocation: (coords, label) =>
    set({
      defaultLocation: coords,
      defaultLabel: label ?? BUSIA_LABEL,
    }),
  setCustomLocation: (coords, label) =>
    set({
      customLocation: coords,
      customLabel: coords ? (label ?? BUSIA_LABEL) : null,
    }),
  clearCustomLocation: () => set({ customLocation: null, customLabel: null }),
}));

export const getActiveLocation = (state: CustomerLocationState): LatLngTuple =>
  state.customLocation ?? state.defaultLocation;

export const getActiveLabel = (state: CustomerLocationState): string =>
  state.customLabel ?? state.defaultLabel;
