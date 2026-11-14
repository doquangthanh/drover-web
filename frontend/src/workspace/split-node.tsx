// Recursive split layout. Gutter drag mutates `style.flex` on the DOM directly (no React state per pointermove);
// the layout is committed once, on pointer up, via `tab.set_layout`.
import { memo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { conn } from "../core/connection";
import { useStore } from "../core/store";
import { containsPane, dragRatio, isLeaf, withRatioAt, type Node, type Split } from "./layout-tree";
import { PaneFrame } from "./pane-frame";

interface NodeProps { node: Node; path: string; tabId: string; flex?: number }

const flexStyle = (flex: number | undefined) => (flex === undefined ? undefined : { flex: `${flex} 1 0` });

export const LayoutNode = memo(function LayoutNode(props: NodeProps) {
  return isLeaf(props.node) ? <Slot {...props} paneId={props.node.pane} /> : <SplitBox {...props} node={props.node} />;
});

function Slot({ paneId, flex }: NodeProps & { paneId: string }) {
  const hasFocus = useStore((s) => s.ui.focusedPane === paneId);
  return (
    <div className={"slot" + (hasFocus ? " has-focus" : "")} data-slot={paneId} style={flexStyle(flex ?? 1)}>
      <PaneFrame paneId={paneId} />
    </div>
  );
}

function SplitBox({ node, path, tabId, flex }: NodeProps & { node: Split }) {
  const box = useRef<HTMLDivElement>(null);
  const hasFocus = useStore((s) => containsPane(node, s.ui.focusedPane));

  const startDrag = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const gutter = ev.currentTarget;
    const el = box.current;
    if (!el) return;
    gutter.setPointerCapture(ev.pointerId);
    const rect = el.getBoundingClientRect();
    const [a, , b] = Array.from(el.children) as HTMLElement[];
    let ratio = node.ratio;
    const move = (e: PointerEvent) => {
      ratio = dragRatio(node.split, rect, e.clientX, e.clientY);
      a.style.flex = `${ratio} 1 0`;
      b.style.flex = `${1 - ratio} 1 0`;
    };
    const up = () => {
      gutter.removeEventListener("pointermove", move);
      const layout = useStore.getState().tabById.get(tabId)?.layout as Node | null | undefined;
      if (layout) conn.rpc("tab.set_layout", { tab: tabId, layout: withRatioAt(layout, path, ratio) }).catch(() => {});
    };
    gutter.addEventListener("pointermove", move);
    gutter.addEventListener("pointerup", up, { once: true });
    gutter.addEventListener("pointercancel", up, { once: true });
  };

  const resetRatio = () => {
    const layout = useStore.getState().tabById.get(tabId)?.layout as Node | null | undefined;
    if (layout) conn.rpc("tab.set_layout", { tab: tabId, layout: withRatioAt(layout, path, 0.5) }).catch(() => {});
  };

  return (
    <div ref={box} className={`split ${node.split}` + (hasFocus ? " has-focus" : "")} style={flexStyle(flex)}>
      <LayoutNode node={node.a} path={path + "a"} tabId={tabId} flex={node.ratio} />
      <div className="gutter" role="separator" onPointerDown={startDrag} onDoubleClick={resetRatio} title="Drag to resize · double-click to even out" />
      <LayoutNode node={node.b} path={path + "b"} tabId={tabId} flex={1 - node.ratio} />
    </div>
  );
}
