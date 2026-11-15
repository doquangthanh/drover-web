const KIND: Record<string, [string, string, string?]> = {
  claude: ["C", "#d97757"], codex: ["X", "#5b8def"], gemini: ["G", "#8f7ce0"], opencode: ["O", "#a6bd91"],
  shell: ["$", "#3a3c40", "#d2d4d9"], sub: ["↳", "#3a3c40", "#d2d4d9"],  // sub = Claude Code sub-agent (Flow board)
};

export function KindIcon({ kind }: { kind?: string }) {
  const [letter, bg, fg] = KIND[kind || ""] || [String(kind || "?").charAt(0).toUpperCase(), "#818793"];
  return <span className="ic" style={{ background: bg, color: fg || "#101114" }} title={kind}>{letter}</span>;
}
