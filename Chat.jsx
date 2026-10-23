import { useState, useRef, useEffect } from "react";
import { ArrowUp, Square, Globe, Copy, Check, Plus } from "lucide-react";
import Markdown from "./Markdown.jsx";
import { claude } from "./api.js";
import { useLocal } from "./store.js";

const SYSTEM = `أنت "أُفُق"، مساعد ذكي شامل يجيب عن الأسئلة في أي مجال: علوم، تقنية، صحة عامة، قانون عام، تاريخ، دين، لغة، برمجة، كتابة، ترجمة، حسابات، دراسة، عمل، ونصائح يومية.
- أجب بلغة المستخدم (العربية افتراضياً) وابدأ بالإجابة مباشرة ثم التفاصيل عند الحاجة.
- للمعلومات الحديثة أو المتغيرة (أخبار، أسعار، أحداث) ابحث في الإنترنت واذكر المصادر.
- لا تختلق معلومات؛ إن لم تكن متأكداً فقل ذلك بوضوح.
- في المسائل الطبية والقانونية والمالية قدّم المعلومة العامة ونبّه بإيجاز إلى مراجعة مختص عند اللزوم.
- إن طُلبت صورة فاقترح على المستخدم تبويب "صور"، وإن طُلب برومبت فيديو فاقترح تبويب "برومبت فيديو".
- استخدم تنسيقاً بسيطاً: فقرات قصيرة وقوائم وكتل كود للبرمجة.`;

const SUGGESTIONS = [
  "اشرح لي الذكاء الاصطناعي ببساطة",
  "ما آخر أخبار التقنية اليوم؟",
  "اكتب كود بايثون لقراءة ملف CSV",
  "ساعدني في كتابة رسالة طلب إجازة",
];

export default function Chat({ settings, onNeedKey }) {
  const [messages, setMessages] = useLocal("ufuq.chat", []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [webSearch, setWebSearch] = useLocal("ufuq.web", true);
  const [copied, setCopied] = useState(null);
  const endRef = useRef(null);
  const taRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [input]);

  const patchLast = (fn) =>
    setMessages((m) => {
      const c = [...m];
      c[c.length - 1] = fn(c[c.length - 1]);
      return c;
    });

  async function send(textArg) {
    const text = (textArg ?? input).trim();
    if (!text || loading) return;
    if (!settings.apiKey) return onNeedKey();

    const next = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "", sources: [] }]);
    setInput("");
    setLoading(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      await claude({
        apiKey: settings.apiKey,
        model: settings.model,
        system: SYSTEM,
        maxTokens: 4096,
        webSearch,
        signal: ctrl.signal,
        messages: next
          .filter((m) => m.content && !m.error)
          .map(({ role, content }) => ({ role, content })),
        onText: (t) => patchLast((l) => ({ ...l, content: t })),
        onStatus: setStatus,
        onSources: (s) =>
          patchLast((l) => {
            const seen = new Set((l.sources || []).map((x) => x.url));
            const add = s.filter((x) => !seen.has(x.url));
            return { ...l, sources: [...(l.sources || []), ...add].slice(0, 6) };
          }),
      });
    } catch (e) {
      if (e.name !== "AbortError") {
        patchLast((l) => ({
          ...l,
          content: (l.content ? l.content + "\n\n" : "") + "⚠️ " + e.message,
          error: true,
        }));
      }
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  async function copy(text, i) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  }

  const host = (u) => {
    try { return new URL(u).hostname.replace("www.", ""); } catch { return u; }
  };

  return (
    <div className="chat">
      <div className="scroll">
        {messages.length === 0 ? (
          <div className="empty">
            <h1>بماذا يمكنني مساعدتك اليوم؟</h1>
            <p>أجيب عن الأسئلة، أكتب وأترجم وأبرمج، وأبحث في الإنترنت عند الحاجة.</p>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div className="thread">
            {messages.map((m, i) => (
              <div key={i} className="row">
                {m.role === "user" ? (
                  <div className="bubble user">{m.content}</div>
                ) : (
                  <div className={`bubble bot ${m.error ? "err" : ""}`}>
                    {m.content ? (
                      <Markdown text={m.content} />
                    ) : (
                      <div className="dots"><i /><i /><i /></div>
                    )}
                    {i === messages.length - 1 && status === "search" && (
                      <div className="searching">أبحث في الإنترنت…</div>
                    )}
                    {m.sources?.length > 0 && (
                      <div className="sources">
                        <span className="src-label">المصادر</span>
                        {m.sources.map((s) => (
                          <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" title={s.title}>
                            {host(s.url)}
                          </a>
                        ))}
                      </div>
                    )}
                    {m.content && !m.error && !(loading && i === messages.length - 1) && (
                      <button className="copy" onClick={() => copy(m.content, i)}>
                        {copied === i ? <Check size={15} /> : <Copy size={15} />}
                        <span>{copied === i ? "تم النسخ" : "نسخ"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="composer">
        <div className="box">
          <textarea
            ref={taRef}
            value={input}
            rows={1}
            placeholder="اكتب سؤالك هنا…"
            aria-label="اكتب سؤالك"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <div className="tools">
            <div className="tool-group">
              <button
                className={`toggle ${webSearch ? "on" : ""}`}
                onClick={() => setWebSearch(!webSearch)}
                aria-pressed={webSearch}
              >
                <Globe size={16} />
                <span>البحث في الإنترنت</span>
              </button>
              {messages.length > 0 && (
                <button className="toggle" onClick={() => !loading && setMessages([])}>
                  <Plus size={16} />
                  <span>جديدة</span>
                </button>
              )}
            </div>
            {loading ? (
              <button className="send" onClick={() => abortRef.current?.abort()} aria-label="إيقاف">
                <Square size={16} fill="currentColor" />
              </button>
            ) : (
              <button className="send" onClick={() => send()} disabled={!input.trim()} aria-label="إرسال">
                <ArrowUp size={20} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
