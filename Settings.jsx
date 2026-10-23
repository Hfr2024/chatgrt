import { useState } from "react";
import { X } from "lucide-react";
import { DEFAULT_MODEL } from "./api.js";

export default function Settings({ settings, onSave, onClose }) {
  const [apiKey, setApiKey] = useState(settings.apiKey || "");
  const [model, setModel] = useState(settings.model || DEFAULT_MODEL);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>الإعدادات</h2>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>

        <label className="field">
          <span>مفتاح Claude API</span>
          <input
            type="password"
            dir="ltr"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
          />
          <small>
            احصل عليه من console.anthropic.com. يُحفظ في متصفحك فقط ولا يُرفع إلى GitHub.
          </small>
        </label>

        <label className="field">
          <span>النموذج</span>
          <input dir="ltr" value={model} onChange={(e) => setModel(e.target.value)} />
          <small>الافتراضي: {DEFAULT_MODEL}</small>
        </label>

        <button
          className="primary wide"
          onClick={() => onSave({ apiKey: apiKey.trim(), model: model.trim() || DEFAULT_MODEL })}
        >
          حفظ
        </button>
      </div>
    </div>
  );
}
