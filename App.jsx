import { useState } from "react";
import { MessageCircle, Image as ImageIcon, Clapperboard, Settings as SettingsIcon } from "lucide-react";
import Chat from "./Chat.jsx";
import Images from "./Images.jsx";
import Video from "./Video.jsx";
import Settings from "./Settings.jsx";
import { useLocal } from "./store.js";
import { DEFAULT_MODEL } from "./api.js";

const TABS = [
  { id: "chat", label: "محادثة", icon: MessageCircle },
  { id: "image", label: "صور", icon: ImageIcon },
  { id: "video", label: "برومبت فيديو", icon: Clapperboard },
];

function Logo() {
  // شمس تشرق فوق خط الأفق
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="10" fill="var(--ink)" />
      <path d="M8 21a9 9 0 0 1 18 0z" fill="var(--sun)" />
      <rect x="5" y="22.5" width="24" height="2" rx="1" fill="var(--paper)" />
      <rect x="10" y="26.5" width="14" height="1.6" rx=".8" fill="var(--paper)" opacity=".5" />
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState("chat");
  const [settings, setSettings] = useLocal("ufuq.settings", { apiKey: "", model: DEFAULT_MODEL });
  const [showSettings, setShowSettings] = useState(false);

  const needKey = () => setShowSettings(true);

  return (
    <div className="app" dir="rtl">
      <header className="top">
        <div className="brand">
          <Logo />
          <div>
            <div className="name">أُفُق</div>
            <div className="sub">اسأل، ارسم، وأخرج فيديو</div>
          </div>
        </div>
        <button className="icon-btn" onClick={() => setShowSettings(true)} aria-label="الإعدادات">
          <SettingsIcon size={20} />
          {!settings.apiKey && <i className="badge" />}
        </button>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? "tab on" : "tab"}
            onClick={() => setTab(id)}
          >
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="horizon" aria-hidden="true" />

      <section hidden={tab !== "chat"} className="pane">
        <Chat settings={settings} onNeedKey={needKey} />
      </section>
      <section hidden={tab !== "image"} className="pane">
        <Images settings={settings} />
      </section>
      <section hidden={tab !== "video"} className="pane">
        <Video settings={settings} onNeedKey={needKey} />
      </section>

      {showSettings && (
        <Settings
          settings={settings}
          onClose={() => setShowSettings(false)}
          onSave={(s) => {
            setSettings(s);
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
