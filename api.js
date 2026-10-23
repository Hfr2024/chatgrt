const API_URL = "https://api.anthropic.com/v1/messages";

export const DEFAULT_MODEL = "claude-sonnet-5-5";

/**
 * استدعاء Claude مع بث النص تدريجياً.
 * المفتاح يُدخله المستخدم ويُحفظ في متصفحه فقط.
 */
export async function claude({
  apiKey,
  model = DEFAULT_MODEL,
  system,
  messages,
  maxTokens = 4096,
  webSearch = false,
  onText,
  onStatus,
  onSources,
  signal,
}) {
  const body = {
    model,
    max_tokens: maxTokens,
    system,
    messages,
    stream: true,
  };
  if (webSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];

  const res = await fetch(API_URL, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = `خطأ ${res.status}`;
    try {
      const j = await res.json();
      msg = j?.error?.message || msg;
    } catch {}
    if (res.status === 401) msg = "مفتاح API غير صحيح. راجع الإعدادات.";
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop();

    for (const ev of events) {
      const line = ev.split("\n").find((l) => l.startsWith("data: "));
      if (!line) continue;
      let j;
      try {
        j = JSON.parse(line.slice(6));
      } catch {
        continue;
      }

      if (j.type === "content_block_start") {
        const b = j.content_block;
        if (b.type === "text" && full) full += "\n\n";
        if (b.type === "server_tool_use") onStatus?.("search");
        if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
          onSources?.(
            b.content.filter((r) => r.url).map((r) => ({ url: r.url, title: r.title || r.url }))
          );
        }
      } else if (j.type === "content_block_delta" && j.delta?.type === "text_delta") {
        onStatus?.("");
        full += j.delta.text;
        onText?.(full);
      } else if (j.type === "error") {
        throw new Error(j.error?.message || "حدث خطأ");
      }
    }
  }
  return full;
}
