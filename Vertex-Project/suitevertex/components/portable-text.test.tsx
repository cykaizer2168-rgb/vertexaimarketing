import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock urlFor so the test doesn't require Sanity env vars at module load time
vi.mock("@/sanity/lib/image", () => ({
  urlFor: () => ({ width: () => ({ url: () => "https://cdn.sanity.io/mock.jpg" }) }),
}));

import { RichText } from "./portable-text";

const blocks = [{ _type: "block", _key: "a", style: "normal", children: [{ _type: "span", _key: "s", text: "Hello world", marks: [] }], markDefs: [] }];

describe("RichText", () => {
  it("renders block text", () => {
    render(<RichText value={blocks} />);
    expect(screen.getByText("Hello world")).toBeInTheDocument();
  });
  it("renders nothing for empty value", () => {
    const { container } = render(<RichText value={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
