# Pico CSS — Skill Reference

> Minimal CSS Framework for semantic HTML. No dependencies, no JavaScript, no utility classes — just elegant, responsive styles applied directly to native HTML elements.
> **Version:** v2.1.1 | **License:** MIT

---

## Installation

### CDN (quickest)
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
```

### NPM / Yarn
```bash
npm install @picocss/pico
# or
yarn add @picocss/pico
```
Then import in SCSS:
```scss
@use "pico";
```

### Composer
```bash
composer require picocss/pico
```

### Starter HTML Template
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
    <title>My App</title>
  </head>
  <body>
    <main class="container">
      <h1>Hello world!</h1>
    </main>
  </body>
</html>
```

---

## Builds Available

| Build | CDN filename | Description |
|---|---|---|
| Default | `pico.min.css` | Uses `.container` class for layout |
| Classless | `pico.classless.min.css` | `<header>`, `<main>`, `<footer>` act as containers |
| Fluid Classless | `pico.fluid.classless.min.css` | Same but fluid (100% width) |

For the **classless** version, no classes are needed at all — just write pure HTML.

---

## Core Philosophy

- **Semantic HTML first** — Styles are applied to native HTML tags, not custom classes.
- **Less than 10 classes** used in the entire framework.
- **No JavaScript** — Pure CSS only.
- **Automatic dark mode** — Respects `prefers-color-scheme` by default.
- **Responsive by default** — All elements adapt to screen sizes.

---

## Layout

### Container
```html
<main class="container">      <!-- Centered, max-width responsive -->
<main class="container-fluid"> <!-- Full-width with padding -->
```

### Grid
Uses CSS Grid. Define columns with `class="grid"`:
```html
<div class="grid">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

### Landmarks & Sections
Use semantic HTML5 landmarks: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>` — all styled automatically.

### Overflow Auto
```html
<div class="overflow-auto">
  <!-- Scrollable content, e.g. wide tables -->
</div>
```

---

## Color Schemes

Set globally via `<meta>` or toggle per-element with `data-theme`:
```html
<!-- Global -->
<meta name="color-scheme" content="light dark">

<!-- Force light/dark on a specific element -->
<section data-theme="light"> ... </section>
<section data-theme="dark"> ... </section>
```

---

## Customization

### CSS Variables
Override Pico's design tokens at the `:root` level:
```css
:root {
  --pico-font-size: 18px;
  --pico-border-radius: 0.5rem;
  --pico-primary: #0172ad;
  --pico-spacing: 1.5rem;
}
```

### Sass Customization
Import and configure before building:
```scss
@use "pico" with (
  $theme-color: "jade",
  $modules: (
    "content/button": true,
    "components/card": true,
  )
);
```
20 precompiled color themes are available (amber, azure, fuchsia, jade, lime, pink, pumpkin, sand, slate, violet, etc.).

### Conditional Styling
Apply Pico styles only inside a specific scope:
```html
<div data-theme="pico">
  <!-- Only this section uses Pico styles -->
</div>
```

### RTL Support
Add `dir="rtl"` to `<html>` or any element:
```html
<html lang="ar" dir="rtl">
```

---

## Content

### Typography
All heading levels (`h1`–`h6`), paragraphs, blockquotes, `<code>`, `<pre>`, `<kbd>`, `<mark>`, `<del>`, `<ins>`, `<abbr>` — styled automatically.

### Links
```html
<a href="#">Default link</a>
<a href="#" role="button">Link as button</a>
```

### Buttons
```html
<button>Primary</button>
<button class="secondary">Secondary</button>
<button class="contrast">Contrast</button>
<button class="outline">Outline</button>
<button disabled>Disabled</button>
```
Any element can become a button with `role="button"`.

### Tables
```html
<table>
  <thead><tr><th>Name</th><th>Value</th></tr></thead>
  <tbody><tr><td>Item</td><td>42</td></tr></tbody>
</table>
```
Wrap in `<div class="overflow-auto">` for horizontal scrolling on mobile.

---

## Forms

All form elements are styled by default without extra classes.

```html
<form>
  <label for="name">Name</label>
  <input type="text" id="name" placeholder="Your name">

  <label for="email">Email</label>
  <input type="email" id="email">

  <label for="bio">Bio</label>
  <textarea id="bio"></textarea>

  <label for="role">Role
    <select id="role">
      <option>Developer</option>
      <option>Designer</option>
    </select>
  </label>

  <label><input type="checkbox"> Accept terms</label>
  <label><input type="radio" name="choice"> Option A</label>

  <!-- Toggle switch -->
  <label><input type="checkbox" role="switch"> Enable feature</label>

  <!-- Range slider -->
  <input type="range" min="0" max="100" value="50">

  <!-- Validation states -->
  <input type="text" aria-invalid="true">   <!-- Invalid -->
  <input type="text" aria-invalid="false">  <!-- Valid -->

  <button type="submit">Submit</button>
</form>
```

### Form Grid
```html
<div class="grid">
  <input type="text" placeholder="First name">
  <input type="text" placeholder="Last name">
</div>
```

---

## Components

### Accordion
```html
<details>
  <summary>Toggle me</summary>
  <p>Hidden content revealed on click.</p>
</details>
```

### Card
```html
<article>
  <header>Card Header</header>
  <p>Card content goes here.</p>
  <footer>Card Footer</footer>
</article>
```

### Dropdown
```html
<details class="dropdown">
  <summary>Menu</summary>
  <ul>
    <li><a href="#">Item 1</a></li>
    <li><a href="#">Item 2</a></li>
  </ul>
</details>
```

### Group (v2 New)
Group buttons, inputs, or selects inline:
```html
<div role="group">
  <input type="text" placeholder="Search...">
  <button>Go</button>
</div>
```

### Loading
```html
<button aria-busy="true">Loading...</button>
<!-- Or on any element -->
<div aria-busy="true"></div>
```

### Modal
```html
<!-- Trigger -->
<button onclick="document.getElementById('my-modal').showModal()">Open Modal</button>

<!-- Modal -->
<dialog id="my-modal">
  <article>
    <header>
      <button aria-label="Close" rel="prev" onclick="this.closest('dialog').close()"></button>
      <h3>Modal Title</h3>
    </header>
    <p>Modal content here.</p>
    <footer>
      <button onclick="this.closest('dialog').close()">Confirm</button>
    </footer>
  </article>
</dialog>
```

### Nav
```html
<nav>
  <ul>
    <li><strong>Brand</strong></li>
  </ul>
  <ul>
    <li><a href="#">Home</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#" role="button">Login</a></li>
  </ul>
</nav>
```

### Progress
```html
<progress value="60" max="100"></progress>
<progress></progress> <!-- Indeterminate -->
```

### Tooltip
```html
<span data-tooltip="I am a tooltip">Hover me</span>
<button data-tooltip="Submit form" data-placement="bottom">Submit</button>
```
`data-placement` accepts: `top` (default), `bottom`, `left`, `right`.

---

## Utility Classes

Pico is minimal with utility classes, but provides a few key ones:

| Class | Usage |
|---|---|
| `.container` | Centered, responsive max-width wrapper |
| `.container-fluid` | Full-width wrapper with padding |
| `.grid` | CSS Grid multi-column layout |
| `.overflow-auto` | Scrollable overflow container |
| `.outline` | Outline variant for buttons |
| `.secondary` | Secondary color variant |
| `.contrast` | High-contrast color variant |

---

## Colors (v2)

Pico ships a full color palette accessible via CSS variables:
```css
/* Format: --pico-color-{name}-{shade} */
--pico-color-azure-500
--pico-color-jade-400
--pico-color-fuchsia-600
```
Shades range from `50` to `950`. Use these to build a custom theme.

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome |  Latest stable |
| Firefox | Latest stable |
| Edge |  Latest stable |
| Safari |  Latest stable |
| IE (any) |  Not supported |

---

## Quick Cheat Sheet
Layout → .container, .container-fluid, .grid, .overflow-auto
Themes → data-theme="light|dark", meta color-scheme
Buttons → <button>, .secondary, .contrast, .outline, role="button"
Forms → Native elements, role="switch", aria-invalid
Components → <details>, <article>, <dialog>, <progress>, data-tooltip
Loading → aria-busy="true"
Groups → role="group"
Custom → CSS vars (--pico-*), Sass @use with config

