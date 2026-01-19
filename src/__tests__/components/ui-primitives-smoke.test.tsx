/**
 * @fileoverview Smoke tests to ensure Tailwind v4-migrated UI primitives render without crashing.
 *
 * These tests intentionally avoid brittle className assertions and instead verify stable
 * accessibility/behavior invariants. Their main purpose is coverage across impacted files.
 */

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { Toggle } from "@/components/ui/toggle";

describe("Tailwind v4 UI primitives", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders non-portal primitives", async () => {
    const user = userEvent.setup();

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
        <Separator />
        <Toggle aria-label="Toggle option">Toggle</Toggle>
      </div>,
    );

    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByText("Badge")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Toggle option" })).toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole("button", { name: "Action" })).toHaveFocus();
  });

  it("renders portal primitives in controlled open state", async () => {
    const user = userEvent.setup();

    // These primitives use portals and some also apply "aria-hidden" to siblings (e.g. Dialog/Select),
    // so we render them in isolation to avoid false negatives in accessible queries.

    {
      const { unmount } = render(
        <Dialog open onOpenChange={() => {}}>
          <DialogContent>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
          </DialogContent>
        </Dialog>,
      );
      expect(screen.getByText("Dialog title")).toBeInTheDocument();
      unmount();
    }

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
          <DropdownMenuTrigger asChild>
            <button type="button">Menu</button>
          </DropdownMenuTrigger>
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
          <PopoverTrigger asChild>
            <button type="button">Popover</button>
          </PopoverTrigger>
          <PopoverContent>Popover content</PopoverContent>
        </Popover>,
      );
      expect(screen.getByText("Popover content")).toBeInTheDocument();
      unmount();
    }

    {
      const { unmount } = render(
        <Select value="featured" onValueChange={() => {}} open onOpenChange={() => {}}>
          <SelectTrigger aria-label="Sort projects by">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured First</SelectItem>
          </SelectContent>
        </Select>,
      );
      expect(screen.getByRole("option", { name: "Featured First" })).toBeInTheDocument();
      unmount();
    }

    {
      const { unmount } = render(
        <ToastProvider>
          <ToastViewport />
          <Toast open onOpenChange={() => {}}>
            <ToastTitle>Toast title</ToastTitle>
            <ToastDescription>Toast description</ToastDescription>
          </Toast>
        </ToastProvider>,
      );
      expect(screen.getByText("Toast title")).toBeInTheDocument();
      await user.tab();
      unmount();
    }
  });

  it("exposes NavigationMenu trigger style helper", () => {
    expect(navigationMenuTriggerStyle()).toEqual(expect.any(String));

    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Nav</NavigationMenuTrigger>
            <NavigationMenuContent>Nav content</NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>,
    );

    expect(screen.getByRole("button", { name: "Nav" })).toBeInTheDocument();
  });
});
