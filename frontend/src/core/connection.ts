// WebSocket link to the drover daemon: RPC calls, events, pane output. Reconnects automatically.
import type { ServerMessage } from "./protocol-types";

function readToken(): string {
  const params = new URLSearchParams(location.search);
  let token = params.get("token");
  try {
    if (token) sessionStorage.setItem("drover-token", token);
    else token = sessionStorage.getItem("drover-token");
  } catch { /* storage may be blocked; keep URL token */ }
  if (params.has("token")) history.replaceState(null, "", location.pathname);
  return token || "";
}

type Waiter = { resolve: (v: unknown) => void; reject: (e: Error) => void };
export type EventHandler = (name: string, data: unknown) => void;
export type OutputHandler = (data: string, isReplay: boolean) => void;

export class Connection {
  token = readToken();
  connected = false;
  onConnection: (up: boolean) => void = () => {};
  private nextId = 1;
  private pending = new Map<number, Waiter>();
  private eventHandlers = new Set<EventHandler>();
  private outputHandlers = new Map<string, OutputHandler>(); // pane id -> fn(data, isReplay)
  private attached = new Set<string>();
  private ws: WebSocket | null = null;

  connect(): void {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${proto}://${location.host}/ws?token=${encodeURIComponent(this.token)}&label=ui`);
    this.ws = ws;
    ws.onopen = () => {
      this.connected = true;
      this.onConnection(true);
      for (const pane of this.attached) this.send({ t: "attach", pane });
    };
    ws.onmessage = (ev) => this.dispatch(JSON.parse(ev.data as string) as ServerMessage);
    ws.onclose = () => {
      this.connected = false;
      this.onConnection(false);
      for (const [, p] of this.pending) p.reject(new Error("disconnected"));
      this.pending.clear();
      setTimeout(() => this.connect(), 1500);
    };
  }

  dispatch(msg: ServerMessage): void {
    if (msg.t === "res") {
      const waiter = this.pending.get(msg.id);
      if (!waiter) return;
      this.pending.delete(msg.id);
      if (msg.error) waiter.reject(Object.assign(new Error(msg.error.message), { code: msg.error.code }));
      else waiter.resolve(msg.result);
    } else if (msg.t === "ev") {
      for (const fn of this.eventHandlers) fn(msg.name, msg.data);
    } else if (msg.t === "out" || msg.t === "replay") {
      this.outputHandlers.get(msg.pane)?.(msg.data, msg.t === "replay");
    }
  }

  send(obj: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(obj));
  }

  rpc<T = any>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      if (!this.connected) return reject(new Error("not connected to drover-server"));
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      this.send({ t: "rpc", id, method, params });
    });
  }

  onEvent(fn: EventHandler): () => void {
    this.eventHandlers.add(fn);
    return () => { this.eventHandlers.delete(fn); };
  }

  attach(pane: string, onData: OutputHandler): void {
    this.outputHandlers.set(pane, onData);
    if (!this.attached.has(pane)) { this.attached.add(pane); this.send({ t: "attach", pane }); }
  }

  detach(pane: string): void {
    this.outputHandlers.delete(pane);
    if (this.attached.delete(pane)) this.send({ t: "detach", pane });
  }

  input(pane: string, data: string): void { this.send({ t: "in", pane, data }); }

  /** After a server-side overflow: ask again for every pane (the daemon replays their output). */
  reattachAll(): void { for (const pane of this.attached) this.send({ t: "attach", pane }); }
}

export const conn = new Connection();
