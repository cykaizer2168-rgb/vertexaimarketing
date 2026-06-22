import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContactForm } from "./contact-form";

describe("ContactForm", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("shows a success message after a successful submit", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }));
    render(<ContactForm />);
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "ada@x.com" } });
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Hi" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
    await waitFor(() => expect(screen.getByText(/thanks/i)).toBeInTheDocument());
  });
});
