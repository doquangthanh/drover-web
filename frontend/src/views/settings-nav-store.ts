// Which Settings section is open. Its own tiny module so code outside the lazy Settings chunk can open a section.
import { create } from "zustand";

export const useSettingsNav = create<{ section: string; rule: string | null }>(() => ({ section: "general", rule: null }));
