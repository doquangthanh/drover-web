import type { Space } from "../../core/protocol-types";

const AV_COLORS = ["#24877b", "#b9602f", "#4e7fe0", "#7a5fd6", "#2f8a4a", "#b2456b", "#8a7a2b", "#3d7f99"];

export function SpaceAvatar({ space }: { space?: Pick<Space, "name" | "color"> | null }) {
  const letter = (space?.name || "?").replace(/[^A-Za-z0-9]/g, "").charAt(0).toUpperCase() || "?";
  return <span className="av" style={{ background: AV_COLORS[(space?.color || 0) % 8] }}>{letter}</span>;
}
