import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BulkActionBar } from "@/components/ui/BulkActionBar";

describe("BulkActionBar", () => {
  it("renders nothing when count is 0", () => {
    const { container } = render(<BulkActionBar count={0} actions={[]} onClear={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders selection count text", () => {
    render(
      <BulkActionBar
        count={3}
        actions={[{ label: "Export", onClick: vi.fn() }]}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByText("3 seleccionados")).toBeDefined();
  });

  it("renders singular text for count=1", () => {
    render(
      <BulkActionBar
        count={1}
        actions={[{ label: "Export", onClick: vi.fn() }]}
        onClear={vi.fn()}
      />,
    );
    expect(screen.getByText("1 seleccionado")).toBeDefined();
  });

  it("renders action buttons and calls onClick", () => {
    const onClick = vi.fn();
    render(
      <BulkActionBar count={2} actions={[{ label: "Exportar", onClick }]} onClear={vi.fn()} />,
    );
    fireEvent.click(screen.getByText("Exportar"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("calls onClear when deselect button is clicked", () => {
    const onClear = vi.fn();
    render(<BulkActionBar count={2} actions={[]} onClear={onClear} />);
    fireEvent.click(screen.getByLabelText("Deseleccionar"));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("has role=toolbar for accessibility", () => {
    render(<BulkActionBar count={1} actions={[]} onClear={vi.fn()} />);
    expect(screen.getByRole("toolbar")).toBeDefined();
  });
});
