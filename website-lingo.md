# Mets Media Website — How It Was Built

A reference guide so you can confidently explain the site to clients, peers, or anyone curious.

---

## The 30-Second Elevator Pitch

> "It's a custom-built static website — hand-coded in HTML, CSS, and JavaScript. No WordPress, no templates, no website builder. The code lives in a GitHub repository and gets deployed to Cloudflare Pages. It's fully responsive, so it works on phones, tablets, and desktops, and it's optimised for Google search with structured data that links it to our Google Business Profile."

That's the pitch. Use it verbatim if you want.

---

## Core Tech Terms

**HTML** (HyperText Markup Language) — the skeleton. Defines the structure and content of every page: headings, paragraphs, images, buttons, sections.

**CSS** (Cascading Style Sheets) — the styling. Controls how everything looks: colours, fonts, spacing, layout, animations.

**JavaScript** (JS) — the behaviour. Makes things interactive: the mobile menu opening, the carousel scrolling, the contact form submitting, scroll animations.

**Static site** — the pages are pre-built HTML files served directly to the browser. No database, no server-side processing. Fast, secure, cheap to host. Opposite of a dynamic site like WordPress where each page is generated on the fly.

**Responsive design** — the layout adapts to screen size. Same site, but reflows for phone, tablet, desktop.

**Mobile-first** — designed for phones first, then expanded for bigger screens. Most traffic is mobile, so it gets priority.

---

## Code & Version Control

**Git** — the version control system. Tracks every change to the code so you can roll back, branch, and collaborate.

**GitHub** — a cloud service that hosts Git repositories. The code lives there.

**Repository (repo)** — the folder containing all the code and its history.

**Commit** — a saved snapshot of changes. Each commit has a message describing what changed.

**Push** — sending local commits up to GitHub.

**Pull** — bringing GitHub changes down to your local machine.

**Branch** — a parallel line of development. `main` is the live one.

---

## Hosting & Domains

**Hosting** — where the website's files live so the internet can reach them. We use **Cloudflare Pages** — free, fast, global CDN.

**CDN** (Content Delivery Network) — a network of servers around the world that serves the site from the closest location to each visitor. Makes the site load fast everywhere.

**Domain registrar** — where you buy the domain name (e.g. `metsmediahouse.com.au`). Common ones: GoDaddy, Namecheap, Cloudflare Registrar.

**DNS** (Domain Name System) — the phonebook of the internet. Translates `metsmediahouse.com.au` into the IP address of the server hosting the site.

**SSL / HTTPS** — encryption between the user's browser and the site. The padlock in the address bar. Cloudflare gives this free automatically.

**Auto-deploy** — every time we push code to GitHub, Cloudflare automatically rebuilds and re-publishes the site within ~30 seconds.

---

## SEO & Discoverability

**SEO** (Search Engine Optimisation) — making the site easy for Google to understand and rank.

**Structured data / JSON-LD** — a hidden block of data on the page in a format Google reads. Tells Google "this is a business, here's the name, address, phone, hours, and here's our Google Business Profile." That's what links the site to your GBP.

**Meta tags** — invisible page info: title, description, keywords. Shows up in Google results.

**Open Graph (OG) tags** — meta tags that control how the site looks when shared on Facebook, LinkedIn, etc. The preview image, title, and description.

**Twitter Cards** — same idea, for X/Twitter.

**Canonical URL** — tells Google "this is the official version of this page" to avoid duplicate content issues.

**Favicon** — the tiny icon in the browser tab.

---

## Forms & Integrations

**Form handler** — service that processes contact form submissions and emails them to you. This site uses **Formspree**. No backend code required.

---

## Common Follow-Up Questions & Answers

**"Did you use WordPress?"**
> No. It's hand-coded — pure HTML, CSS, and JavaScript. Faster, more secure, and fully custom.

**"Did you use a template?"**
> No template. Designed and coded from scratch so every section reflects the brand.

**"How long did it take?"**
> A few weeks of iteration — build, polish, mobile audit, performance tuning.

**"What did it cost to build?"**
> Built in-house. Hosting is free (Cloudflare Pages), domain is about $20/year. Form handler has a free tier.

**"Can you update it easily?"**
> Yes — changes are made in the code, committed to GitHub, and the live site updates automatically within 30 seconds.

**"Why didn't you use Squarespace or Wix?"**
> Builders are great for speed but slow, generic, and limited. Custom code is faster, cleaner, and we own everything.

**"Is it mobile friendly?"**
> Fully responsive. Designed mobile-first, then expanded for desktop.

**"How does Google find it?"**
> It's indexed by Google through structured data that links it to our Google Business Profile.

---

## The Stack at a Glance

- **Code:** HTML + CSS + JavaScript (vanilla, no frameworks)
- **Version control:** Git + GitHub
- **Hosting:** Cloudflare Pages (global CDN, free)
- **Domain:** `metsmediahouse.com.au`
- **Forms:** Formspree
- **SEO:** JSON-LD structured data linked to Google Business Profile
- **Editor:** Code written in a text editor (VS Code or similar)
