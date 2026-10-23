import { useState, useRef } from "react";
import { Clapperboard, Copy, Check, Square } from "lucide-react";
import Markdown from "./Markdown.jsx";
import { claude } from "./api.js";

const FIELDS = [
  "إعلان تجاري", "سينمائي / قصة", "تعليمي وشرح", "طعام ومطاعم", "سفر وسياحة", "عقارات",
  "موضة وجمال", "رياضة ولياقة", "تقني ومنتجات", "ألعاب فيديو", "أطفال ورسوم متحركة",
  "وثائقي", "طبي وصحي", "تعليم وتدريب", "ديني وثقافي", "موسيقى وكليب", "سوشيال ميديا / ريلز",
  "شركات وعلامات تجارية", "أخرى",
];
const TOOLS = ["عام (يناسب أي أداة)", "Sora", "Veo", "Runway", "Kling", "Pika", "Luma"];
const DURATIONS = ["5 ثوانٍ", "10 ثوانٍ", "15 ثانية", "30 ثانية", "60 ثانية"];
const RATIOS = ["16:9 أفقي", "9:16 عمودي", "1:1 مربع"];

const SYSTEM = `You are a senior prompt engineer for AI video generators and a film director.
Given the field, target tool, duration, aspect ratio and the user's idea (any language), produce production-ready prompts.

Rules:
- Write every video prompt in ENGLISH inside a fenced code block so it can be copied.
- Each prompt covers: subject, action, setting, camera movement and lens, lighting, color grade, mood, style, and audio/sound if the tool supports it.
- Up to 10 seconds: ONE main prompt plus one alternative. Longer: split into shots of 4-8 seconds, each with its own prompt, keeping character and style consistent by repeating key descriptors.
- Add a negative prompt block (what to avoid).
- Tailor wording to the chosen tool (e.g. Sora/Veo like natural cinematic language, Runway/Kling like clear camera terms, Pika likes short punchy prompts).
- Write headings and explanations in Arabic, prompts in English.

Output structure:
## ملخص الفكرة
(two lines)
## اللقطات
### لقطة 1 — (title)
(code block prompt)
...
## Negative prompt
(code block)
## نصائح للأداة
(3 short bullets)`;

export default function Video({ settings, onNeedKey }) {
  const [field, setField] = useState(FIELDS[0]);
  const [tool, setTool] = useState(TOOLS[0]);
  const [duration, setDuration] = useState(DURATIONS[1]);
  const [ratio, setRatio] = useState(RATIOS[0]);
  const [idea, setIdea] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);

  async function run() {
    if (!idea.trim() || loading) return;
    if (!settings.apiKey) return onNeedKey();
    setLoading(true);
    setOut("");
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await claude({
        apiKey: settings.apiKey,
        model: settings.model,
        system: SYSTEM,
        maxTokens: 3000,
        signal: ctrl.signal,
        messages: [
          {
            role: "user",
            content: `Field: ${field}\nTarget tool: ${tool}\nDuration: ${duration}\nAspect ratio: ${ratio}\nIdea: ${idea.trim()}`,
          },
        ],
        onText: setOut,
      });
    } catch (e) {
      if (e.name !== "AbortError") setOut("⚠️ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(out);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="scroll">
      <div className="panel">
        <div className="two">
          <label className="field">
            <span>المجال</span>
            <select value={field} onChange={(e) => setField(e.target.value)}>
              {FIELDS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label className="field">
            <span>أداة الفيديو</span>
            <select value={tool} onChange={(e) => setTool(e.target.value)}>
              {TOOLS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="field">
            <span>المدة</span>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              {DURATIONS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </label>
          <label className="field">
            <span>الأبعاد</span>
            <select value={ratio} onChange={(e) => setRatio(e.target.value)}>
              {RATIOS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </label>
        </div>

        <label className="field">
          <span>فكرة الفيديو</span>
          <textarea
            rows={3}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="مثال: إعلان لقهوة مختصة يبدأ بحبوب تتساقط ثم يُصب الفنجان في الصباح الباكر"
          />
        </label>

        {loading ? (
          <button className="primary wide" onClick={() => abortRef.current?.abort()}>
            <Square size={16} fill="currentColor" />
            <span>إيقاف</span>
          </button>
        ) : (
          <button className="primary wide" onClick={run} disabled={!idea.trim()}>
            <Clapperboard size={18} />
            <span>اكتب البرومبتات</span>
          </button>
        )}
      </div>

      {out && (
        <div className="result">
          <Markdown text={out} />
          {!loading && (
            <button className="copy" onClick={copyAll}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              <span>{copied ? "تم النسخ" : "نسخ الكل"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
