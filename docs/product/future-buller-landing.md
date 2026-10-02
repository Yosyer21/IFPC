# Future Buller — Home (landing) rebuild spec

Source of truth: **https://www.futureballer.com.au** (reference site).
This document organises the reference content for implementation in `apps/web`
(the public home page). Brand target: **Future Buller**.

## 1. Brand
- Name: **Future Buller** (compact wordmark: `FutureBuller`).
  Note: the reference site spells it "Future **Baller**"; our project keeps
  "Future Buller" (see Open decisions).
- Category: holistic girls' football development, ages 10–18.
- Founders / ambassadors: **Chloe Logarzo** (Matildas midfielder, ex-professional)
  and **Emily Gielnik**.
- Tone: empowering, confident, warm, elite-but-accessible, real Matilda role models.

## 2. Audience
- Primary: girls aged 10–18 who play football.
- Secondary: parents / guardians (decision makers).
- Tertiary: clubs & teams (squad super sessions), coaches.

## 3. Core message
"Where passion meets purpose — every young footballer is supported to grow with
confidence, skill and resilience."

## 4. Home sections (in order)

### 4.1 Navbar
- Left: logo wordmark `FutureBuller`.
- Links: Home · About · Activities · Events · Products · Contact.
- Right actions: Account (Login / Register) · Cart.
- Mobile: hamburger menu.

### 4.2 Hero
- Eyebrow: "Empowering girls aged 10–18"
- H1: "The World of Future Buller"
- Sub: "We want to build an environment where young girls thrive — a space to
  build their knowledge, confidence and self-belief."
- CTAs: "Explore Activities" (→ /activities) · "Train With A Matilda" (→ /events)
- Visual: hero photo of players / Matildas.

### 4.3 Mission / Intro
- "Welcome to Future Buller, where passion meets purpose and every young
  footballer is supported to grow with confidence, skill and resilience."
- "Future Buller is dedicated to empowering girls aged 10–18 through holistic
  football development — combining technical training, mindset, leadership and
  personal growth to help each player perform their best both on and off the pitch."

### 4.4 Offerings (3 cards)
1. **Inclusive Football Clinics** — immersive 5-hour sessions focused on technical
   skills, tactical awareness, speed & agility and the mindset to succeed at any
   level. Open to all abilities; delivered by elite coaches, guest players and
   performance-focused content.
2. **Super Sessions & Squad Experiences** — exclusive training brought directly to
   your club or team, with on-pitch focus and off-pitch leadership development.
3. **Future Buller Planner** — a professional goal-setting journal inspired by the
   performance processes of elite players, to stay organised, intentional and
   focused all season long.

### 4.5 Positioning strip
"Future Buller is more than a clinic — it's a pathway that supports continuous
development through events, tools and resources that build confidence, resilience
and self-belief. Whether you're just starting out or working to take your game to
the next level, Future Buller gives you the tools and community to drive real
improvement and love for the game."

### 4.6 Founders
- Heading: "Led by Matildas"
- "Future Buller provides a world-class experience, led by accomplished
  international players **Chloe Logarzo** and **Emily Gielnik**, who are driven to
  share their knowledge and expertise — equipping young girls with holistic
  football skills and cultivating mental strength, resilience and leadership."
- "Chloe and Emily attend **all** camps. The mission is to create a belief on and
  off the field, inspiring the next generation of female footballers."
- Cards: Chloe Logarzo (Matildas) · Emily Gielnik.

### 4.7 Featured Event — "Train With A Matilda"
- Badge: "Limited spots · September 27 – 29"
- Title: "Train with a Matilda — Chloe Logarzo"
- Role: "Matildas Midfielder · Ex-Professional Footballer"
- Copy: "This September, Chloe is coming to Ballarat Grammar to deliver an elite
  football masterclass — her first visit to Ballarat. Players aged 12–18 take part
  in high-intensity sessions designed to accelerate technical skills, tactical
  understanding and mental resilience. Chloe coaches in small groups and works with
  every player individually. A rare level of access to elite football coaching."
- Details: Ballarat Grammar · 27–29 September 2026 · 10am–3pm · 3 days · bring a
  packed lunch each day.
- Partner: "In association with **PitchUp**".
- Price: **$385.00 AUD**
- CTA: "Buy Ticket"

### 4.8 Featured Product — "Future Buller Planner"
- Line: "Train Your Mind Like a Matilda"
- Price: **Now $29.99** (was $49.99) — **40% OFF**
- Copy + bullets — young players learn how to: Set clear goals · Stay confident
  after tough games · Build strong daily habits · Stay motivated through setbacks.
- "Created with guidance from Chloe Logarzo and Emily Gielnik. This isn't just a
  notebook — it's a mindset training tool."
- Delivery: dispatched within 2 business days; Australia Post flat rate $14.95.
- CTA: "Buy" / "Add to Favourites"

### 4.9 Newsletter
- "Become a Baller! Sign up with your email address to receive news and updates."
- Field: email → "Sign Up".

### 4.10 Contact
- Heading: "We would love to hear from you"
- Fields: Name · Email · Contact Number · Message → "Send"
- Option: subscribe to the newsletter.

### 4.11 Footer
- Columns: Explore (Activities, Events, Products) · Company (About, Contact) ·
  Info (Disclaimer, Copyright, Privacy).
- Social links.
- Bottom: © Future Buller · site credit "Website by BlueSoap" (optional).

## 5. Secondary pages (reference site)
- `/activities` — one item: "Future Baller Squad Super Session" (POA).
- `/events` — one item: "Train With A Matilda" ($385.00).
- `/products` — one item: "Future Baller Planner By Migoals" ($29.99).
- `/about` — About / founders.
- `/contact` — contact form + details.
- `/info/{disclaimer,copyright,privacy}` — legal.

## 6. Mapping to the current project

Existing landing (`apps/web/components/landing/`): `navbar`, `hero`, `trusted-by`,
`roles`, `how-it-works`, `features`, `stats`, `testimonials`, `cta`, `footer`,
`logo`, `icons`.

| New section        | Reuse / rebuild                                   | Action   |
| ------------------ | ------------------------------------------------- | -------- |
| Navbar             | `navbar.tsx` + `logo.tsx`                         | rebuild  |
| Hero               | `hero.tsx`                                        | rebuild  |
| Mission / Intro    | —                                                 | new      |
| Offerings (3)      | `features.tsx`                                    | rebuild  |
| Positioning strip  | —                                                 | new      |
| Founders           | `trusted-by.tsx`                                  | replace  |
| Featured Event     | —                                                 | new      |
| Featured Product   | —                                                 | new      |
| Newsletter         | `cta.tsx`                                         | rebuild  |
| Contact            | `app/(public)/contact/page.tsx` + action          | reuse    |
| Footer             | `footer.tsx`                                      | rebuild  |

Composition of the new home (`app/(public)/page.tsx`):
Navbar · Hero · Mission · Offerings · Positioning · Founders · FeaturedEvent ·
FeaturedProduct · Newsletter · Footer. (Contact lives on `/contact`.)

## 7. Data & routes
- **Events / Activities** ("Train With A Matilda", "Squad Super Session"): title,
  price, dates, venue, description, image → map to a lightweight `offering`, or
  reuse existing `Camp` / `Opportunity` models.
- **Products** (Planner): name, price, compare-at price, description, image → no
  commerce backend yet; keep as content (static) initially.
- **Contact** → existing contact action (`app/actions`).
- **Newsletter** → collect subscribers (new lightweight model, or skip for now).

Routes to add/change: `/activities`, `/events`, `/products`, `/about` (and keep
`/contact`, `/info/*`). Nav links updated accordingly.

## 8. Assets needed
- Hero image (players / Matildas) — placeholder for now.
- Founder portraits (Chloe Logarzo, Emily Gielnik).
- Event image (Ballarat Grammar session).
- Product image (Planner).
- SVG wordmark `FutureBuller` (replace `logo.tsx`).

## 9. Implementation plan
- **Phase 0 — Brand rename** Future Buller → Future Buller (metadata, landing, emails,
  footer, README, docs).
- **Phase 1 — Content config**: centralise the copy above in a content file
  (e.g. `apps/web/lib/landing-content.ts`) + asset placeholders.
- **Phase 2 — Landing rebuild**: navbar, hero, mission, offerings, positioning,
  founders, featured event, featured product, newsletter, footer.
- **Phase 3 — Secondary pages**: `/activities`, `/events`, `/products`, `/about`.
- **Phase 4 — Validate**: `pnpm typecheck`, `pnpm lint`, `pnpm build`.

## 10. Open decisions
1. **Brand spelling**: keep **Future Buller** (project history + your instruction)
   or match the site's "Future **Baller**"?
2. **Language**: public copy in English (AU), as the reference site?
3. **Scope**: fully replace the platform sections (Roles / Stats / Testimonials)
   with the Future Buller content, or keep some and merge?
4. **Commerce**: real checkout for events/products, or display-only for now?

