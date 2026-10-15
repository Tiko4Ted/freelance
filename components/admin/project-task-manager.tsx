"use client";

import { useEffect, useState } from "react";

type Task = { id: string; title: string; description: string; payoutAmountCents: number; status: string; sequence: number; assignmentCount: number };

export function ProjectTaskManager({ projectId }: { projectId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState({ title: "", description: "", payoutAmountCents: "7500", sequence: "1", status: "OPEN" });
  const [message, setMessage] = useState("");
  async function load() { const response = await fetch(`/api/v1/admin/project-tasks?projectId=${projectId}`); if (response.ok) setTasks((await response.json()).tasks as Task[]); }
  useEffect(() => {
    let active = true;
    void fetch(`/api/v1/admin/project-tasks?projectId=${projectId}`)
      .then(async (response) => response.ok ? (await response.json()).tasks as Task[] : [])
      .then((nextTasks) => { if (active) setTasks(nextTasks); });
    return () => { active = false; };
  }, [projectId]);
  async function createTask(event: React.FormEvent) { event.preventDefault(); const data = new FormData(); data.set("projectId", projectId); Object.entries(form).forEach(([key, value]) => data.set(key, value)); const response = await fetch("/api/v1/admin/project-tasks", { method: "POST", body: data }); setMessage(response.ok ? "Task created" : "Task could not be created"); if (response.ok) { setForm({ ...form, title: "", description: "", sequence: String(tasks.length + 2) }); void load(); } }
  async function setStatus(task: Task, status: "OPEN" | "CLOSED") { await fetch(`/api/v1/admin/project-tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); void load(); }
  async function setPrice(task: Task) { const value = window.prompt("New task price in cents", String(task.payoutAmountCents)); if (!value) return; await fetch(`/api/v1/admin/project-tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payoutAmountCents: Number(value) }) }); void load(); }
  return <div className="mt-5 border-t border-brand-sand/70 pt-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-gold-strong">Task queue</p><span className="text-xs text-brand-muted">{tasks.length} tasks</span></div><div className="mt-3 divide-y divide-brand-sand/70 border-y border-brand-sand/70">{tasks.map((task) => <div className="flex flex-wrap items-center justify-between gap-3 py-3" key={task.id}><div><p className="text-sm font-semibold">{task.sequence}. {task.title}</p><p className="text-xs text-brand-muted">${(task.payoutAmountCents / 100).toFixed(0)} · {task.assignmentCount} assignments · {task.status}</p></div><div className="flex gap-2"><button className="text-xs font-semibold text-brand-gold-strong underline" onClick={() => setPrice(task)} type="button">Edit price</button><button className="text-xs font-semibold text-brand-ink underline" onClick={() => setStatus(task, task.status === "OPEN" ? "CLOSED" : "OPEN")} type="button">{task.status === "OPEN" ? "Close" : "Open"}</button></div></div>)}</div><form className="mt-4 grid gap-2" onSubmit={createTask}><p className="text-xs font-semibold text-brand-ink">Add task</p><input className="h-10 rounded-[10px] border border-brand-sand bg-brand-canvas px-3 text-sm" placeholder="Task title" required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /><textarea className="min-h-20 rounded-[10px] border border-brand-sand bg-brand-canvas px-3 py-2 text-sm" placeholder="What the contributor must deliver" required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /><div className="grid grid-cols-2 gap-2"><input className="h-10 rounded-[10px] border border-brand-sand bg-brand-canvas px-3 text-sm" min="1" type="number" value={form.payoutAmountCents} onChange={(event) => setForm({ ...form, payoutAmountCents: event.target.value })} /><input className="h-10 rounded-[10px] border border-brand-sand bg-brand-canvas px-3 text-sm" min="1" type="number" value={form.sequence} onChange={(event) => setForm({ ...form, sequence: event.target.value })} /></div><button className="h-10 rounded-[10px] bg-brand-ink text-sm font-semibold text-white" type="submit">Create task</button>{message ? <p className="text-xs font-semibold text-brand-gold-strong">{message}</p> : null}</form></div>;
}
