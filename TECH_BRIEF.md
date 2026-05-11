# Mets Media Website — Tech Stack

## Current Project

**Mets Media House** — portfolio site for our videography & photography business. Live at https://metsmediahouse.com.au.

## Tech Stack

### Frontend (the site itself)

- Pure HTML, CSS, and JavaScript — no framework
- Single `index.html` file (~440 lines, ~22KB)
- Custom CSS with CSS variables for theming (cream `#FAF7E8` on black `#000000`)
- Single `js/main.js` for nav, mobile menu, work carousel drag/scroll, contact form, scroll animations, and YouTube modal player
- Google Fonts (Manrope, weights 300–800)
- Responsive design with custom mobile breakpoints (down to 375px)
- Local image assets (project thumbnails, logo, favicons)
- Looping background hero video on the landing screen

### Integrations

- **Formspree** — backend for the contact form (no server needed)
- **YouTube iframe embeds** — work carousel cards open project videos in a custom modal player

### Development workflow

- Claude Code (Anthropic's AI coding agent) for writing and editing code
- GitHub for version control — repo: `callum-mets/mets-media-website`
- Direct commits to `main`
