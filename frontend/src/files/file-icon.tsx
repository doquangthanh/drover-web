// React renderer for the logic in core/file-icons.ts. Re-renders when the icon set or the Material lookup changes.
import { useSyncExternalStore } from "react";
import { fileIconSpec, onIconSetChange } from "../core/file-icons";

let version = 0;
onIconSetChange(() => { version++; }); // registered at load, so it runs before React's subscribers
const getVersion = () => version;

/** `set` overrides the chosen icon set (appearance previews). */
export function FileIcon({ name, dir = false, open = false, set }: { name: string; dir?: boolean; open?: boolean; set?: string }) {
  useSyncExternalStore(onIconSetChange, getVersion);
  const spec = fileIconSpec(name, dir, open, set);
  switch (spec.type) {
    case "none": return null;
    case "img": return <img className="fi" alt="" loading="lazy" src={spec.src} />;
    case "badge": return <span className="fi fi-badge" style={{ background: spec.background }}>{spec.label}</span>;
    case "svg": return (
      <span className="fi">
        {/* body is a trusted static constant from core/file-icons.ts */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true" dangerouslySetInnerHTML={{ __html: spec.body }} />
      </span>
    );
  }
}
