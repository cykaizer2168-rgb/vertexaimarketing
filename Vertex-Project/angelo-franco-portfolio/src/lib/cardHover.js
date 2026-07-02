// Shared hover animation for cards across every section.
// Lift + subtle scale + cyan glow, with a springy, "alive" feel.
export const cardHover = {
  y: -6,
  scale: 1.015,
  boxShadow: "0 22px 55px -20px rgba(61, 169, 252, 0.30)",
  transition: { type: "spring", stiffness: 280, damping: 20 },
};
