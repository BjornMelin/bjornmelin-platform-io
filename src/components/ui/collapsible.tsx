"use client";

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible";

/** Groups the parts of a collapsible region. */
const Collapsible = CollapsiblePrimitive.Root;

/** Toggles the associated collapsible panel. */
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

/** Renders the collapsible panel content. */
const CollapsibleContent = CollapsiblePrimitive.Panel;

export { Collapsible, CollapsibleContent, CollapsibleTrigger };
