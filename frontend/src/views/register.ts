// Registers the alt views; each is a lazy chunk, loaded the first time it is opened.
import { createElement, lazy, Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { registerView } from "./view-registry";

function lazyView(name: string, load: () => Promise<{ default: ComponentType }>): void {
  const View: LazyExoticComponent<ComponentType> = lazy(load);
  registerView(name, () => createElement(Suspense, { fallback: null }, createElement(View)));
}

lazyView("inbox", () => import("./inbox-view"));
lazyView("tree", () => import("./tree-view"));
lazyView("machines", () => import("./machines-view"));
lazyView("settings", () => import("./settings-view"));
lazyView("server", () => import("./server-view"));
