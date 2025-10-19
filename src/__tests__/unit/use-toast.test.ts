import { describe, expect, it } from "vitest";
import { reducer } from "@/hooks/use-toast";

describe("use-toast reducer", () => {
  it("adds a toast and enforces limit", () => {
    const state = { toasts: [] as any[] };
    const next = reducer(state, { type: "ADD_TOAST", toast: { id: "1", title: "Hi" } as any });
    expect(next.toasts).toHaveLength(1);
    const next2 = reducer(next, { type: "ADD_TOAST", toast: { id: "2", title: "Yo" } as any });
    expect(next2.toasts).toHaveLength(1); // TOAST_LIMIT = 1
    expect(next2.toasts[0].id).toBe("2");
  });

  it("updates a toast by id", () => {
    const base = { toasts: [{ id: "x", title: "A" }] as any[] };
    const updated = reducer(base, { type: "UPDATE_TOAST", toast: { id: "x", title: "B" } as any });
    expect(updated.toasts[0].title).toBe("B");
  });

  it("dismisses matching toast by id", () => {
    const base = { toasts: [{ id: "x", title: "A", open: true }] as any[] };
    const dismissed = reducer(base, { type: "DISMISS_TOAST", toastId: "x" });
    expect(dismissed.toasts[0].open).toBe(false);
  });

  it("removes a toast by id", () => {
    const base = { toasts: [{ id: "x", title: "A" }] as any[] };
    const removed = reducer(base, { type: "REMOVE_TOAST", toastId: "x" });
    expect(removed.toasts).toHaveLength(0);
  });
});

