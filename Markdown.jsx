// عرض Markdown مبسّط وآمن (بدون dangerouslySetInnerHTML)
function renderInline(text, keyBase) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\))/g;
  let last = 0;
  let m;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${keyBase}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={k}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={k} className="ic">{t.slice(1, -1)}</code>);
    else {
      const mm = t.match(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/);
      out.push(<a key={k} href={mm[2]} target="_blank" rel="noopener noreferrer">{mm[1]}</a>);
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function Markdown({ text }) {
  const chunks = text.split(/```/);
  return (
    <div className="md">
      {chunks.map((chunk, ci) => {
        if (ci % 2 === 1) {
          const nl = chunk.indexOf("\n");
          const code = nl >= 0 ? chunk.slice(nl + 1) : chunk;
          return (
            <pre key={ci} dir="ltr">
              <code>{code.replace(/\n$/, "")}</code>
            </pre>
          );
        }
        const blocks = [];
        let list = null;
        const flush = () => {
          if (!list) return;
          const Tag = list.type;
          const idx = blocks.length;
          blocks.push(
            <Tag key={`l${ci}-${idx}`}>
              {list.items.map((it, j) => (
                <li key={j}>{renderInline(it, `li${ci}-${idx}-${j}`)}</li>
              ))}
            </Tag>
          );
          list = null;
        };
        chunk.split("\n").forEach((line, li) => {
          const key = `${ci}-${li}`;
          const bullet = line.match(/^\s*[-*•]\s+(.*)/);
          const num = line.match(/^\s*\d+[.)]\s+(.*)/);
          const head = line.match(/^(#{1,4})\s+(.*)/);
          if (bullet) {
            if (!list || list.type !== "ul") { flush(); list = { type: "ul", items: [] }; }
            list.items.push(bullet[1]);
          } else if (num) {
            if (!list || list.type !== "ol") { flush(); list = { type: "ol", items: [] }; }
            list.items.push(num[1]);
          } else if (head) {
            flush();
            blocks.push(<h4 key={key}>{renderInline(head[2], key)}</h4>);
          } else if (line.trim() === "") {
            flush();
          } else {
            flush();
            blocks.push(<p key={key}>{renderInline(line, key)}</p>);
          }
        });
        flush();
        return <div key={ci}>{blocks}</div>;
      })}
    </div>
  );
}
