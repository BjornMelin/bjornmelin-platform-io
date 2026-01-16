import { isValidElement } from "react";

type Visitor = (element: { type: unknown; props: Record<string, unknown> }) => void;

export const walkReactTree = (node: unknown, visitor: Visitor): void => {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const child of node) walkReactTree(child, visitor);
    return;
  }

  if (isValidElement(node)) {
    visitor(node as { type: unknown; props: Record<string, unknown> });
    walkReactTree((node as { props: { children?: unknown } }).props.children, visitor);
  }
};
