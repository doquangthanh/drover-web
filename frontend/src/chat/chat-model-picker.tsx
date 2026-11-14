// Which model answers. The list comes from the agent itself (loaded when you open the picker); until then a short built-in one.
import { chatActions, loadOptions } from "./chat-actions";
import { useChats } from "./chat-store";
import type { Chat, ChatModel } from "./chat-types";

const BUILT_IN: ChatModel[] = [
  { value: "default", label: "Default", description: "" }, { value: "opus", label: "Opus", description: "" },
  { value: "sonnet", label: "Sonnet", description: "" }, { value: "haiku", label: "Haiku", description: "" },
];

export function ModelPicker({ chat }: { chat: Chat }) {
  const models = useChats((s) => s.options[chat.id]?.models) ?? BUILT_IN;
  const current = chat.model || "default";
  const list = models.some((m) => m.value === current) ? models : [...models, { value: current, label: current, description: "" }];
  return (
    <select className="in chat-model" aria-label="Model" value={current} title={list.find((m) => m.value === current)?.description || "Model"}
      onFocus={() => void loadOptions(chat.id)} onMouseDown={() => void loadOptions(chat.id)}
      onChange={(e) => chatActions.setChatModel(chat.id, e.target.value)}>
      {list.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
    </select>
  );
}
