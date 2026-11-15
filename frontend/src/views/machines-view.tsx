// Machines: connection cards + "Add a machine" form. The form owns its state, so store updates never reset it.
import { useEffect } from "react";
import { useStore } from "../core/store";
import { clearTopExtra, setTopExtra } from "../shell/top-extra-store";
import { LocalCard, MachineCard } from "./machine-card";
import { MachineAddForm } from "./machine-add-form";

export default function MachinesView() {
  const machines = useStore((s) => s.raw.machines);
  const spaces = useStore((s) => s.raw.spaces?.length || 0);
  const agents = useStore((s) => s.raw.panes?.length || 0);

  useEffect(() => {
    setTopExtra("machines", { right: <button className="btn pri" onClick={() => document.getElementById("m-a")?.focus()}>+ Add machine</button> });
    return () => clearTopExtra("machines");
  }, []);

  return (
    <div className="msplit">
      <div className="mgrid">
        <LocalCard spaces={spaces} agents={agents} />
        {(machines || []).map((m) => <MachineCard key={m.alias} m={m} />)}
        <p className="meta" style={{ gridColumn: "1 / -1", padding: "8px 4px", lineHeight: 1.6, margin: 0 }}>
          Phone: with Tailscale on both devices, run `dr server stop` then `dr server run --listen &lt;tailscale-ip&gt;`,
          {" "}and open the link from `dr server url` on the phone. Or SSH-tunnel the port. Keep that link private.
        </p>
      </div>
      <MachineAddForm />
    </div>
  );
}
