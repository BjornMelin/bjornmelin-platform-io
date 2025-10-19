/**
 * @fileoverview Unit tests for toast reducer behavior.
 */
import { describe, expect, it } from "vitest";
import { reducer } from "@/hooks/use-toast";

type Toast = { id: string; title?: string; open?: boolean };
type State = { toasts: Toast[] };

describe("use-toast reducer", () => {
  it("adds a toast and enforces limit", () => {
    const state: State = { toasts: [] };
    const next = reducer(state as never, {
      type: "ADD_TOAST",
      toast: { id: "1", title: "Hi" } as never,
    });
    expect(next.toasts).toHaveLength(1);
    const next2 = reducer(next as never, {
      type: "ADD_TOAST",
      toast: { id: "2", title: "Yo" } as never,
    });
    expect(next2.toasts).toHaveLength(1); // TOAST_LIMIT = 1
    expect(next2.toasts[0].id).toBe("2");
  });

  it("updates a toast by id", () => {
    const base: State = { toasts: [{ id: "x", title: "A" }] };
    const updated = reducer(base as never, {
      type: "UPDATE_TOAST",
      toast: { id: "x", title: "B" } as never,
    });
    expect(updated.toasts[0].title).toBe("B");
  });

  it("dismisses matching toast by id", () => {
    const base: State = { toasts: [{ id: "x", title: "A", open: true }] };
    const dismissed = reducer(base as never, { type: "DISMISS_TOAST", toastId: "x" } as never);
    expect(dismissed.toasts[0].open).toBe(false);
  });

  it("removes a toast by id", () => {
    const base: State = { toasts: [{ id: "x", title: "A" }] };
    const removed = reducer(base as never, { type: "REMOVE_TOAST", toastId: "x" } as never);
    expect(removed.toasts).toHaveLength(0);
  });
});
