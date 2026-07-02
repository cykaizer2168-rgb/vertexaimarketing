# Angelo B. Franco — Landing Page

React + Vite + Tailwind CSS + Framer Motion landing page, built from your
Oracle ACS reference design (Hero, About, Services, Journey, Selected Work,
Tech Skills, Certifications, Testimonials, CTA, Footer).

## What's included
- **Framer Motion**: scroll-reveal animations on every section, orbiting icon
  badges in the hero, an animated tech marquee, and an animated timeline line.
- **Parallax**: the hero portrait/orbit and headline shift at different scroll
  speeds (`useScroll` + `useTransform` in `src/components/Hero.jsx`).
- **Image placeholders**: every section that needs a photo/screenshot/badge
  uses `<ImagePlaceholder label="..." />` from `src/components/Placeholder.jsx`
  — a dashed, labeled box you can swap for a real `<img>` later.
- **Icon placeholders**: hero orbit icons use `lucide-react` (`IconBadge`),
  easy to swap for your own SVGs/logos.
- **Case study link placeholders**: each card in "Selected Work" has a
  `data-link-placeholder="true"` anchor with `href="#case-study-..."` —
  search for `data-link-placeholder` to find and replace all of them with
  real URLs.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build -> dist/
```

## Swapping placeholders for real content

1. **Images**: replace `<ImagePlaceholder label="..." />` with
   `<img src="/your-image.jpg" className="rounded-2xl aspect-[4/3] object-cover w-full" />`
   (drop files into `public/`).
2. **Case study links**: in `src/components/SelectedWork.jsx`, update the
   `href` in the `PROJECTS` array, and remove `onClick={(e) => e.preventDefault()}`.
3. **Copy/stats/skills**: each section's data lives at the top of its file as
   a plain array/object — edit directly, no JSX hunting required.

## File map

```
src/
  App.jsx                 // assembles all sections
  index.css                // tailwind + placeholder styles
  components/
    Navbar.jsx
    Hero.jsx               // parallax + orbiting icon badges
    TechMarquee.jsx         // infinite scroll logo strip
    About.jsx
    Services.jsx
    Journey.jsx             // animated timeline
    SelectedWork.jsx        // case study cards + link placeholders
    TechSkills.jsx          // skills tags + certification badges
    Bottom.jsx              // industries, testimonial, stats, CTA, footer
    Placeholder.jsx          // ImagePlaceholder / IconBadge / LinkPlaceholder
```
