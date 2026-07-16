/**
 * Smoke tests that ensure Tailwind v4 UI primitives render without crashing.
 *
 * These tests intentionally avoid brittle className assertions and instead verify stable
 * accessibility/behavior invariants. Their main purpose is coverage across impacted files.
 */

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { ToastProvider, useToastManager } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";

function ToastFixture() {
  const { add } = useToastManager();

  return (
    <>
      <button
        type="button"
        onClick={() => add({ title: "Toast title", description: "Toast description" })}
      >
        Show toast
      </button>
      <button type="button" onClick={() => add({ title: "Newer toast" })}>
        Show newer toast
      </button>
    </>
  );
}

describe("Tailwind v4 UI primitives", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders non-portal primitives", async () => {
    const user = userEvent.setup();
    const separatorRef = createRef<HTMLDivElement>();

    render(
      <div>
        <Button>Action</Button>
        <Badge>Badge</Badge>
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Body</CardContent>
        </Card>
        <label htmlFor="name">Name</label>
        <Input id="name" name="name" autoComplete="name" />
        <label htmlFor="message">Message</label>
        <Textarea id="message" name="message" />
        <Separator ref={separatorRef} />
      </div>,
    );

    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByText("Badge")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(separatorRef.current).toHaveAttribute("role", "separator");
    await user.tab();
    expect(screen.getByRole("button", { name: "Action" })).toHaveFocus();
  });

  it("renders portal primitives in controlled open state", async () => {
    const user = userEvent.setup();

    // These primitives use portals and some also apply "aria-hidden" to siblings (e.g. Sheet/Select),
    // so we render them in isolation to avoid false negatives in accessible queries.

    {
      const { unmount } = render(
        <Sheet open onOpenChange={() => {}}>
          <SheetContent>
            <SheetTitle>Sheet title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
          </SheetContent>
        </Sheet>,
      );
      expect(screen.getByText("Sheet title")).toBeInTheDocument();
      unmount();
    }

    {
      const { unmount } = render(
        <DropdownMenu open onOpenChange={() => {}}>
          <DropdownMenuTrigger render={<button type="button">Menu</button>} />
          <DropdownMenuContent>
            <DropdownMenuItem>Item</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>,
      );
      expect(screen.getByText("Menu")).toBeInTheDocument();
      expect(screen.getByRole("menu", { name: "Menu" })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: "Item" })).toBeInTheDocument();
      unmount();
    }

    {
      const { unmount } = render(
        <Popover open onOpenChange={() => {}}>
          <PopoverTrigger render={<button type="button">Popover</button>} />
          <PopoverContent>Popover content</PopoverContent>
        </Popover>,
      );
      expect(screen.getByText("Popover content")).toBeInTheDocument();
      unmount();
    }

    {
      const { unmount } = render(
        <Select
          items={[{ value: "featured", label: "Featured First" }]}
          value="featured"
          onValueChange={() => {}}
          open
          onOpenChange={() => {}}
        >
          <SelectTrigger aria-label="Sort projects by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="featured">Featured First</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>,
      );
      expect(screen.getByRole("option", { name: "Featured First" })).toBeInTheDocument();
      unmount();
    }

    {
      const { unmount } = render(
        <ToastProvider>
          <ToastFixture />
          <Toaster />
        </ToastProvider>,
      );
      await user.click(screen.getByRole("button", { name: "Show toast" }));
      expect(await screen.findByText("Toast title")).toBeInTheDocument();
      expect(screen.getByText("Toast description")).toBeInTheDocument();
      await user.hover(screen.getByRole("dialog", { name: "Toast title" }));
      const closeButton = screen.getByRole("button", { name: "Close notification" });
      await user.click(closeButton);
      await waitFor(() => expect(screen.queryByText("Toast title")).not.toBeInTheDocument());
      unmount();
    }
  });

  it("hides older toasts beyond the provider limit", async () => {
    const user = userEvent.setup();

    render(
      <ToastProvider limit={1}>
        <ToastFixture />
        <Toaster />
      </ToastProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Show toast" }));
    await user.click(screen.getByRole("button", { name: "Show newer toast" }));

    const limitedToast = (await screen.findByText("Toast title")).closest('[role="dialog"]');
    const visibleToast = screen.getByText("Newer toast").closest('[role="dialog"]');

    expect(limitedToast).toHaveAttribute("data-limited");
    expect(limitedToast).toHaveClass("data-[limited]:hidden");
    expect(visibleToast).not.toHaveAttribute("data-limited");
  });
});
