import { memo, useState } from "react";
import { parseBlocks, type Inline } from "./chat-markdown-logic";

function InlineView({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) => {
        switch (p.t) {
          case "code": return <code key={i} className="md-code">{p.text}</code>;
          case "bold": return <strong key={i}>{p.text}</strong>;
          case "italic": return <em key={i}>{p.text}</em>;
          case "link": return <a key={i} href={p.href} target="_blank" rel="noopener noreferrer">{p.text}</a>;
          default: return <span key={i}>{p.text}</span>;
        }
      })}
    </>
  );
}

function CodeBlock({ lang, text }: { lang: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200); }).catch(() => {});
  };
  return (
    <div className="md-pre">
      <div className="md-pre-head"><span>{lang || "text"}</span><button onClick={copy}>{copied ? "Copied" : "Copy"}</button></div>
      <pre>{text}</pre>
    </div>
  );
}

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      {parseBlocks(text).map((b, i) => {
        switch (b.type) {
          case "code": return <CodeBlock key={i} lang={b.lang} text={b.text} />;
          case "heading": return <div key={i} className={`md-h md-h${b.level}`}><InlineView parts={b.inline} /></div>;
          case "quote": return <blockquote key={i}><InlineView parts={b.inline} /></blockquote>;
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return <Tag key={i}>{b.items.map((it, j) => <li key={j}><InlineView parts={it} /></li>)}</Tag>;
          }
          default: return <p key={i}><InlineView parts={b.inline} /></p>;
        }
      })}
    </div>
  );
});
