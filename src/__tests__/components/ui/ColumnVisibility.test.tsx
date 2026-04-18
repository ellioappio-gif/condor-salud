import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnVisibility } from "@/components/ui/ColumnVisibility";

const COLUMNS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "status", label: "Status" },
];

describe("ColumnVisibility", () => {
  it("renders the trigger button", () => {
    render(
      <ColumnVisibility
        columns={COLUMNS}
        visible={["name", "email", "role", "status"]}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Visibilidad de columnas")).toBeDefined();
  });

  it("opens dropdown on click", () => {
    render(
      <ColumnVisibility
        columns={COLUMNS}
        visible={["name", "email", "role", "status"]}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByLabelText("Visibilidad de columnas"));
    expect(screen.getByText("Name")).toBeDefined();
    expect(screen.getByText("Email")).toBeDefined();
  });

  it("sets aria-expanded correctly", () => {
    render(
      <ColumnVisibility
        columns={COLUMNS}
        visible={["name", "email", "role", "status"]}
        onChange={vi.fn()}
      />,
    );
    const btn = screen.getByLabelText("Visibilidad de columnas");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
  });

  it("calls onChange when toggling a column off", () => {
    const onChange = vi.fn();
    render(
      <ColumnVisibility
        columns={COLUMNS}
        visible={["name", "email", "role", "status"]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByLabelText("Visibilidad de columnas"));
    fireEvent.click(screen.getByLabelText("Role"));
    expect(onChange).toHaveBeenCalledWith(["name", "email", "status"]);
  });

  it("enforces minimum 2 visible columns", () => {
    const onChange = vi.fn();
    render(<ColumnVisibility columns={COLUMNS} visible={["name", "email"]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Visibilidad de columnas"));
    // Try to uncheck 'name' — should not call onChange since only 2 visible
    fireEvent.click(screen.getByLabelText("Name"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
