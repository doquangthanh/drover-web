// A small, safe markdown subset for assistant text: fenced code, headings, lists, quotes, **bold**, *italic*, `code`, links.
// Produces plain data; chat-markdown.tsx turns it into elements (never innerHTML).
export type Inline =
  | { t: "text" | "code" | "bold" | "italic"; text: string }
  | { t: "link"; text: string; href: string };

export type Block =
  | { type: "code"; lang: string; text: string }
  | { type: "heading"; level: number; inline: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "quote"; inline: Inline[] }
  | { type: "para"; inline: Inline[] };

const SAFE_LINK = /^(https?:\/\/|mailto:)/i;
const PATTERNS: [RegExp, (m: RegExpExecArray) => Inline][] = [
  [/`([^`\n]+)`/, (m) => ({ t: "code", text: m[1] })],
  [/\*\*([^*\n]+)\*\*/, (m) => ({ t: "bold", text: m[1] })],
  [/\[([^\]\n]+)\]\(([^)\s]+)\)/, (m) => (SAFE_LINK.test(m[2]) ? { t: "link", text: m[1], href: m[2] } : { t: "text", text: m[0] })],
  [/(?<![\w*])\*(?=\S)([^*\n]*?\S)\*(?![\w*])/, (m) => ({ t: "italic", text: m[1] })], // `*` hugging the words, so "2 * 3 * 4" stays math
];

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let rest = src;
  while (rest) {
    let best: { index: number; length: number; token: Inline } | null = null;
    for (const [re, make] of PATTERNS) {
      const m = re.exec(rest);
      if (m && (!best || m.index < best.index)) best = { index: m.index, length: m[0].length, token: make(m) };
    }
    if (!best) { out.push({ t: "text", text: rest }); break; }
    if (best.index) out.push({ t: "text", text: rest.slice(0, best.index) });
    out.push(best.token);
    rest = rest.slice(best.index + best.length);
  }
  return out;
}

const LIST = /^\s*(?:([-*+])|(\d+)[.)])\s+(.*)$/;

export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => { if (para.length) { blocks.push({ type: "para", inline: parseInline(para.join("\n")) }); para = []; } };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const fence = /^```\s*([\w+-]*)\s*$/.exec(line.trim());
    if (fence) { // an unclosed fence (text still streaming) runs to the end
      flush();
      const body: string[] = [];
      while (++i < lines.length && lines[i].trim() !== "```") body.push(lines[i]);
      blocks.push({ type: "code", lang: fence[1], text: body.join("\n") });
      continue;
    }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const item = LIST.exec(line);
    if (heading) { flush(); blocks.push({ type: "heading", level: heading[1].length, inline: parseInline(heading[2]) }); }
    else if (item) {
      flush();
      const ordered = !!item[2];
      const last = blocks[blocks.length - 1];
      if (last?.type === "list" && last.ordered === ordered) last.items.push(parseInline(item[3]));
      else blocks.push({ type: "list", ordered, items: [parseInline(item[3])] });
    } else if (line.startsWith(">")) { flush(); blocks.push({ type: "quote", inline: parseInline(line.replace(/^>\s?/, "")) }); }
    else if (line.trim() === "") flush();
    else para.push(line);
  }
  flush();
  return blocks;
}
