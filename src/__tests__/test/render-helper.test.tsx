import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useToastManager } from "@/components/ui/toast";
import { renderWithProviders } from "@/test/helpers/render";

function ToastProbe() {
  const { add } = useToastManager();

  return (
    <button type="button" onClick={() => add({ title: "Helper toast" })}>
      Show helper toast
    </button>
  );
}

describe("renderWithProviders", () => {
  it("provides the Base toast manager and renders manager-owned toasts", async () => {
    const { user } = renderWithProviders(<ToastProbe />);

    await user.click(screen.getByRole("button", { name: "Show helper toast" }));

    expect(await screen.findByText("Helper toast")).toBeInTheDocument();
  });
});
