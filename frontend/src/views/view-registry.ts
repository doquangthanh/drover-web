// Alt views (inbox, tree, files, ...) register themselves here; app.tsx renders the one matching ui.view.
// Each phase adds a `register.ts` next to its code; main.tsx auto-imports every `**/register.ts`.
import type { ComponentType } from "react";

const views = new Map<string, ComponentType>();

export function registerView(name: string, component: ComponentType): void { views.set(name, component); }
export function viewFor(name: string): ComponentType | undefined { return views.get(name); }
