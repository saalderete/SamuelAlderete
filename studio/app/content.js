// Everything the studio says, in one place. The words are the home page's own (../index.html) and the
// résumé's (../resume.md); the room's cards and the screen's programs both read from here, so a fact
// changes in one spot. Nothing here is invented: if it is not on the site, it is not in this file.

export const person = {
  name: "Samuel Alderete",
  role: "Software Engineer",
  line: "I build and run software for the trades I work in. Graduating from UTEP in December 2026.",
  place: "El Paso, Texas · English and Spanish",
  email: "salderete29@gmail.com",
};

export const links = {
  site: "../",
  inventory: "../inventory.html",
  resumePdf: "../resume.pdf",
  resumeHtml: "../resume.html",
  github: "https://github.com/saalderete",
  linkedin: "https://www.linkedin.com/in/saalderete/",
  email: "mailto:salderete29@gmail.com",
  nerrix: "https://nerrixdigital.com",
};

// The shutter's greetings, in the site's order; the last frame is "Open / Abierto".
export const greetings = [
  "Hello", "Hola", "Olá", "Bonjour", "Hallo", "Xin chào", "안녕하세요", "こんにちは", "你好", "नमस्ते", "مرحبا", "Yáʼátʼééh",
];

export const about = [
  "I've run a construction crew in El Paso since 2023, and I write the software that crew and businesses like it run on.",
  "My main project is KasaPro, a multi-tenant back office for contractors and equipment-rental businesses: estimates, jobs, invoices, rentals, e-signatures and card payments. Three businesses use it in production. In summer 2025 I interned at BW Fusion, where I built the end-to-end testing platform that replaced their paid testing subscription, and I run Nerrix Digital, a small studio building websites for local businesses.",
  "I like the parts of software where a mistake costs someone money: keeping one customer's data away from another's, payments, retries, and tests that stop the next change from breaking the last one. I use AI tools every day as part of how I build, and I can walk you through every line of what's here.",
];

export const stats = [
  { n: "3", label: "businesses running on KasaPro" },
  { n: "~$100K", label: "invoiced and rented through it" },
  { n: "940", label: "automated tests on KasaPro" },
  { n: "100+", label: "invoices a day read by the system I built at BW Fusion" },
];

export const contact = [
  "I graduate in December 2026 and I'm looking for a full-time software engineering role: backend, full-stack, mobile or ML.",
  "Email is the fastest way to reach me. I'm happy to walk through any of these code bases live, the private ones included.",
];

// The things on the shelves and the desk. `id` is the object's name in the room (P.item.<id>), `kind`
// sorts it in the screen's inventory, `tag` is its shelf label, `loop` is a film in ../assets.
export const items = [
  {
    id: "kasapro", kind: "project", tag: "KasaPro", es: "Proyecto",
    name: "KasaPro", sub: "In production",
    text: "A back office for contractors and rental businesses. Every table is fenced by business, and a test reads every SQL query in the codebase and fails the build if one forgets the fence.",
    facts: [["Users", "3 businesses"], ["Through it", "~$100,000 invoiced and rented"], ["Tests", "940"]],
    stack: ["Node.js", "Express 5", "MySQL 8", "EJS", "Stripe Connect", "Square", "Render"],
    links: [{ label: "kasaprohq.com", href: "https://www.kasaprohq.com" }],
    note: "Private repo · code walkthrough on request · no customer data on screen",
    loop: "kasapro-loop",
    object: "A clipboard with an invoice, and a card reader",
  },
  {
    id: "testharvest", kind: "project", tag: "TestHarvest", es: "Proyecto",
    name: "TestHarvest", sub: "Open source",
    text: "Self-hosted browser testing and monitoring: no-code tests, scheduled runs in real Chromium, one alert when something breaks and one when it recovers.",
    facts: [["Queue", "Postgres with worker leases and crash recovery, no Redis"], ["Schedules", "Fire once per due time across any number of workers"], ["Security", "Five roles, AES-256-GCM secrets, host allowlists"]],
    stack: ["TypeScript", "React", "Express", "PostgreSQL", "Playwright", "Docker"],
    links: [{ label: "Code on GitHub", href: "https://github.com/saalderete/endtest-clone" }],
    object: "A signal light: it goes red when something breaks and green when it recovers",
  },
  {
    id: "loan", kind: "project", tag: "Loan Approval ML", es: "Proyecto",
    name: "Loan Approval ML", sub: "Open source",
    text: "A calibrated, explainable model of how lenders decided real Texas mortgage applications, with a fair-lending audit that keeps protected attributes out of training.",
    facts: [["Data", "483,685 HMDA applications (2025, Texas)"], ["Result", "ROC-AUC 0.857 · PR-AUC 0.685 on 96,737 held out"], ["Tests", "95"]],
    stack: ["Python", "scikit-learn", "FastAPI", "Streamlit", "Docker", "GitHub Actions"],
    links: [{ label: "Code on GitHub", href: "https://github.com/saalderete/Loan-Approval-ML" }],
    object: "A balance scale with a small house on one pan",
  },
  {
    id: "nerrix", kind: "project", tag: "Nerrix Digital", es: "Proyecto",
    name: "Nerrix Digital", sub: "My studio's site",
    text: "The site for my web studio, which sells ads, custom landing pages and KasaPro to local service businesses. Behind the pages that sell, it runs an AI chat that knows every price and term, a booking calendar, a plan builder, live template demos and the studio's lab builds.",
    facts: [["Chat", "OpenAI on the studio's own server: one conversation across pages, capped replies, 8 messages a minute per visitor"], ["Booking", "A day you scrub across an El Paso time-lapse; no double booking, calendar invites, cancel links, an admin page"]],
    stack: ["React 19", "Vite", "Tailwind", "Framer Motion", "GSAP", "Express", "Turso", "Render"],
    links: [{ label: "nerrixdigital.com", href: "https://www.nerrixdigital.com" }],
    note: "Private repo · code walkthrough on request",
    loop: "nerrix-loop",
    object: "A row of small storefronts",
  },
  {
    id: "gpi", kind: "project", tag: "Gracias Por Invitar", es: "Proyecto",
    name: "Gracias Por Invitar", sub: "Team project",
    text: "One calendar for everything happening in El Paso and Juárez, by date, with who each event is for and what it costs. It's the product my software project management team at UTEP is planning, and I built it as a working mock from our field study.",
    facts: [["Pages", "Calendar by day and category, event pages, a saved plan, an organizer form"], ["Course", "CS 4390/5388 Software Project Management, Fall 2026"]],
    stack: ["Vite", "React 19", "Tailwind 4", "Motion", "React Router"],
    links: [{ label: "Open the mock", href: "https://gpi-j4aw.onrender.com" }, { label: "Project portal", href: "https://gpi-portal.onrender.com" }],
    note: "A working mock with sample events",
    loop: "gpi-loop",
    object: "A tear-off desk calendar",
  },
  {
    id: "kasarentals", kind: "project", tag: "KasaRentals", es: "Proyecto",
    name: "KasaRentals", sub: "In production",
    text: "Online booking for skid steers and dump trailers. The calendar asks KasaPro which dates are free, the form books into it, and the owner approves from email.",
    facts: [["Booking", "Live availability, haul-away quotes, idempotent bookings"]],
    stack: ["HTML", "CSS", "JavaScript", "KasaPro public API"],
    links: [{ label: "kasarentals.com", href: "https://kasarentals.com" }],
    loop: "kasarentals-storm-loop",
    object: "A toy skid steer",
  },
  {
    id: "foreman", kind: "experience", tag: "Kasa Roofing", es: "Experiencia",
    name: "Foreman · Kasa Roofing & Construction", sub: "Jan 2023 – Present · El Paso",
    text: "Run daily operations for a crew of five across about 100 projects a year: scheduling, materials and subcontractors. I own the customer from first estimate to final walkthrough on jobs from $5,000 to $20,000, which is where every feature in KasaPro started.",
    facts: [],
    stack: ["Crew of 5", "~100 projects a year", "Bilingual customers"],
    links: [],
    object: "A hard hat and a tape measure",
  },
  {
    id: "bwfusion", kind: "experience", tag: "BW Fusion", es: "Experiencia",
    name: "Software Engineering Intern · BW Fusion (Agronomy 365)", sub: "May – Sep 2025 · Remote",
    text: "Built an in-house end-to-end testing platform with Playwright for Agronomy 365, BW Fusion's crop-analytics software for growers, and set up 24/7 monitoring of its critical workflows with alerts on failure. Built an AI invoice-processing system that reads and extracts data from 100+ invoices a day, and shipped full-stack features including role-based authentication and automated email notifications.",
    facts: [["Replaced", "A paid EndTest.io subscription, built in-house, saving thousands a year"]],
    stack: ["Playwright", "TypeScript", "React", "Express.js", "PostgreSQL", "LLM APIs"],
    links: [],
    object: "A seedling in a pot",
  },
  {
    id: "studio", kind: "experience", tag: "Nerrix Digital", es: "Experiencia",
    name: "Founder & Developer · Nerrix Digital", sub: "Jan 2026 – Present",
    text: "Founded a web studio for local businesses and delivered four client sites across contracting, rental and service businesses. I design, build and deploy them on Render and run the hosting, domains and upkeep, including AI assistants that answer each business's questions and capture leads.",
    facts: [],
    stack: ["React", "Node.js", "Express", "Render", "OpenAI API"],
    links: [{ label: "nerrixdigital.com", href: "https://nerrixdigital.com" }],
    object: "A ring of four keys, one for each client site",
  },
  {
    id: "utep", kind: "education", tag: "UTEP", es: "Estudios",
    name: "The University of Texas at El Paso", sub: "Jan 2024 – Dec 2026 (expected)",
    text: "Bachelor of Science in Computer Science.",
    facts: [],
    stack: [],
    links: [],
    object: "A graduation cap",
  },
  {
    id: "resume", kind: "desk", tag: "Résumé", es: "Currículum",
    name: "Résumé", sub: "One page",
    text: "Everything here on one sheet.",
    facts: [],
    stack: [],
    links: [{ label: "Résumé (PDF)", href: "../resume.pdf" }, { label: "Read it as a page", href: "../resume.html" }],
    object: "A printed sheet on the desk",
  },
  {
    id: "contact", kind: "desk", tag: "Contact", es: "Contacto",
    name: "Contact", sub: "El Paso, Texas · English and Spanish",
    text: "I graduate in December 2026 and I'm looking for a full-time software engineering role: backend, full-stack, mobile or ML. Email is the fastest way to reach me. I'm happy to walk through any of these code bases live, the private ones included.",
    facts: [],
    stack: [],
    links: [{ label: "salderete29@gmail.com", href: "mailto:salderete29@gmail.com" }, { label: "LinkedIn", href: "https://www.linkedin.com/in/saalderete/" }, { label: "GitHub", href: "https://github.com/saalderete" }],
    object: "A card tray on the desk",
  },
];

// "Also on the shelf", as the home page lists them.
export const alsoOnTheShelf = [
  { id: "gpi-portal", name: "Gracias Por Invitar project portal", sub: "Team · UTEP", text: "Next.js site where each document is one MDX source, rendered as a page and printed to PDF in CI", href: "https://gpi-portal.onrender.com" },
  { id: "tv-home", name: "tv-home", sub: "Kotlin", text: "A replacement Android TV home screen in Jetpack Compose, with screenshot tests and reversible adb scripts" },
  { id: "luv", name: "Luv", sub: "In progress", text: "A Mac menu-bar voice assistant in Swift: hold a key, talk, and the answer streams and speaks sentence by sentence" },
];

// The four product films, in ../assets (mp4 with a webp poster of the same name).
export const films = [
  { id: "kasapro-loop", title: "KasaPro", line: "The back office: estimates, jobs, invoices, rentals." },
  { id: "nerrix-loop", title: "Nerrix Digital", line: "The studio's site." },
  { id: "gpi-loop", title: "Gracias Por Invitar", line: "One calendar for El Paso and Juárez. Sample events." },
  { id: "kasarentals-storm-loop", title: "KasaRentals", line: "Online booking for skid steers and dump trailers." },
];

export const byId = Object.fromEntries(items.map((it) => [it.id, it]));
