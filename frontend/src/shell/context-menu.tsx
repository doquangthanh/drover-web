// Right-click menu: opens at the pointer, stays inside the window, closes on Escape / outside click / scroll / resize.
import { useEffect, useLayoutEffect, useRef } from "react";
import { closeContextMenu, useContextMenu } from "../core/context-menu-store";

export function ContextMenu() {
  const menu = useContextMenu((s) => s.menu);
  const box = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => { // keep the menu fully on screen, then focus the first entry for keyboard use
    const el = box.current;
    if (!menu || !el) return;
    const { width, height } = el.getBoundingClientRect();
    el.style.left = `${Math.max(4, Math.min(menu.x, window.innerWidth - width - 4))}px`;
    el.style.top = `${Math.max(4, Math.min(menu.y, window.innerHeight - height - 4))}px`;
    el.querySelector<HTMLButtonElement>("button")?.focus();
  }, [menu]);

  useEffect(() => {
    if (!menu) return;
    const outside = (e: Event) => { if (!box.current?.contains(e.target as Node)) closeContextMenu(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); closeContextMenu(); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const items = Array.from(box.current?.querySelectorAll("button") ?? []);
      const i = items.indexOf(document.activeElement as HTMLButtonElement);
      items[(i + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
    };
    window.addEventListener("pointerdown", outside, true);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("resize", closeContextMenu);
    window.addEventListener("blur", closeContextMenu);
    window.addEventListener("wheel", closeContextMenu, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("resize", closeContextMenu);
      window.removeEventListener("blur", closeContextMenu);
      window.removeEventListener("wheel", closeContextMenu);
    };
  }, [menu]);

  if (!menu) return null;
  return (
    <div ref={box} className="ctxmenu" role="menu" style={{ left: menu.x, top: menu.y }} onContextMenu={(e) => e.preventDefault()}>
      {menu.items.map((it) => (
        <button key={it.label} role="menuitem" className={it.danger ? "danger" : undefined}
          onClick={() => { closeContextMenu(); setTimeout(it.run, 0); }}>
          <span>{it.label}</span>{it.hint ? <span className="hint">{it.hint}</span> : null}
        </button>
      ))}
    </div>
  );
}
