import { createElement, lazy, Suspense } from "react";
import { registerView } from "../views/view-registry";

const ChangesView = lazy(() => import("./changes-view"));

registerView("changes", () => createElement(Suspense, { fallback: createElement("div", { className: "view meta" }, "Loading changes…") }, createElement(ChangesView)));
