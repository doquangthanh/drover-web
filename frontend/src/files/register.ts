import { createElement, lazy, Suspense } from "react";
import { registerView } from "../views/view-registry";

const FilesView = lazy(() => import("./files-view"));

registerView("files", () => createElement(Suspense, { fallback: createElement("div", { className: "view meta" }, "Loading files…") }, createElement(FilesView)));
