import { useState } from "react";
import { Download, RefreshCw, Copy, Wand2 } from "lucide-react";
import { claude } from "./api.js";

const STYLES = [
  { id: "none", label: "بدون", add: "" },
  { id: "real", label: "واقعي", add: "photorealistic, natural lighting, high detail, 35mm photo" },
  { id: "cine", label: "سينمائي", add: "cinematic still, dramatic lighting, anamorphic lens, film grain" },
  { id: "anime", label: "أنمي", add: "anime style, clean line art, vibrant colors" },
  { id: "water", label: "ألوان مائية", add: "watercolor painting, soft washes, paper texture" },
  { id: "3d", label: "ثلاثي الأبعاد", add: "3D render, soft studio lighting, smooth materials, octane render" },
  { id: "logo", label: "شعار", add: "minimal vector logo, flat design, white background" },
];

const RATIOS = [
  { id: "sq", label: "مربع", w: 1024, h: 1024 },
  { id: "pt", label: "عمودي", w: 768, h: 1024 },
  { id: "ls", label: "أفقي", w: 1280, h: 720 },
];

const ENHANCE_SYSTEM = `You write prompts for text-to-image models. Convert the user's idea (any language) into ONE detailed English prompt: subject, setting, composition, lighting, mood, camera/lens or medium. Max 90 words. Output only the prompt, no quotes, no preface.`;

const makeUrl = (prompt, w, h, seed) =>
  `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${seed}&nologo=true&model=flux`;

async function download(url, name) {
  try {
    const r = await fetch(url);
    const b = await r.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(b);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

export default function Images({ settings }) {
  const [idea, setIdea] = useState("");
  const [style, setStyle] = useState("none");
  const [ratio, setRatio] = useState("sq");
  const [enhance, setEnhance] = useState(true);
  const [busy, setBusy] = useState(false);
  const [finalPrompt, setFinalPrompt] = useState("");
  const [items, setItems] = useState([]);
  const [note, setNote] = useState("");

  const patch = (id, p) => setItems((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));

  async function generate(reusePrompt) {
    const text = (reusePrompt ?? idea).trim();
    if (!text || busy) return;
    setBusy(true);
    setNote("");

    let prompt = text;
    if (!reusePrompt && enhance) {
      if (settings.apiKey) {
        try {
          prompt = (
            await claude({
              apiKey: settings.apiKey,
              model: settings.model,
              system: ENHANCE_SYSTEM,
              maxTokens: 300,
              messages: [{ role: "user", content: text }],
            })
          ).trim();
        } catch (e) {
          setNote("تعذّر تحسين الوصف، استخدمت وصفك كما هو.");
        }
      } else {
        setNote("أضف مفتاح API في الإعدادات لتحسين الوصف تلقائياً. استخدمت وصفك كما هو.");
      }
    }

    const styleAdd = STYLES.find((s) => s.id === style)?.add;
    const full = styleAdd && !reusePrompt ? `${prompt}, ${styleAdd}` : prompt;
    setFinalPrompt(full);

    const { w, h } = RATIOS.find((r) => r.id === ratio);
    const batch = [0, 1].map((n) => {
      const seed = Math.floor(Math.random() * 1e6) + n;
      return { id: `${Date.now()}-${n}`, url: makeUrl(full, w, h, seed), prompt: full, loading: true, error: false };
    });
    setItems((l) => [...batch, ...l]);
    setBusy(false);
  }

  return (
    <div className="scroll">
      <div className="panel">
        <label className="field">
          <span>صف الصورة التي تريدها</span>
          <textarea
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="مثال: قطة ترتدي بدلة رائد فضاء تقف على سطح القمر عند الغروب"
          />
        </label>

        <div className="group">
          <span className="group-label">النمط</span>
          <div className="pills">
            {STYLES.map((s) => (
              <button key={s.id} className={style === s.id ? "pill on" : "pill"} onClick={() => setStyle(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="group">
          <span className="group-label">الأبعاد</span>
          <div className="pills">
            {RATIOS.map((r) => (
              <button key={r.id} className={ratio === r.id ? "pill on" : "pill"} onClick={() => setRatio(r.id)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <label className="check">
          <input type="checkbox" checked={enhance} onChange={(e) => setEnhance(e.target.checked)} />
          <span>حسّن وصفي تلقائياً بالذكاء الاصطناعي (ينتج صوراً أدق)</span>
        </label>

        <button className="primary wide" onClick={() => generate()} disabled={!idea.trim() || busy}>
          <Wand2 size={18} />
          <span>{busy ? "جارٍ التجهيز…" : "ولّد الصور"}</span>
        </button>
        {note && <p className="hint">{note}</p>}
      </div>

      {finalPrompt && (
        <div className="prompt-box" dir="ltr">
          <p>{finalPrompt}</p>
          <button className="copy" onClick={() => navigator.clipboard?.writeText(finalPrompt)}>
            <Copy size={14} /> <span>Copy prompt</span>
          </button>
        </div>
      )}

      <div className="gallery">
        {items.map((it) => (
          <figure key={it.id} className="shot">
            <div className="frame">
              {it.loading && !it.error && <div className="shimmer">جارٍ الرسم…</div>}
              {it.error && <div className="shimmer err">تعذّر التوليد. أعد المحاولة.</div>}
              <img
                src={it.url}
                alt={it.prompt}
                onLoad={() => patch(it.id, { loading: false })}
                onError={() => patch(it.id, { error: true, loading: false })}
                style={{ opacity: it.loading || it.error ? 0 : 1 }}
              />
            </div>
            <figcaption>
              <button className="mini" onClick={() => download(it.url, `ufuq-${it.id}.png`)}>
                <Download size={15} /> <span>تحميل</span>
              </button>
              <button className="mini" onClick={() => generate(it.prompt)} disabled={busy}>
                <RefreshCw size={15} /> <span>نسخة جديدة</span>
              </button>
            </figcaption>
          </figure>
        ))}
      </div>

      {items.length === 0 && (
        <p className="hint center">اكتب وصفاً واضغط "ولّد الصور" لتحصل على صورتين مختلفتين.</p>
      )}
    </div>
  );
}
