# Mezbaan Multinational Cuisine Website 🇵🇰🇮🇳

A stunning, responsive landing page built with **HTML5, CSS3, and Vanilla JavaScript** for Mezbaan Multinational Cuisine. This website serves as a digital menu and storefront for the authentic Indian and Pakistani restaurant located in Mangere, Auckland

> **Location:** 190 Kirkbride Road, Mangere, Auckland, NZ.

## 📸 Preview

![Mezbaan Website Preview](https://images.pexels.com/photos/29685054/pexels-photo-29685054.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1)

*Note: In a production environment, ensure you replace the sample Pexels images used for the Hero and Gallery sections with high-quality photos of the actual restaurant interior and food.*

## ✨ Features

- **Responsive Design:** Fully compatible with desktop, tablet, and mobile devices.
- **Tabbed Menu System:** A dynamic JavaScript-based filtering system that allows users to switch between Appetizers, Chaat, Mains, and Biryani instantly.
- **Smooth Navigation:** Fixed header with smooth scroll offset for fixed content areas.
- **Scroll Reveal Animations:** Elements fade in and slide up as the user scrolls down the page.
- **Halal & Vegetarian Badges:** Clear UI indicators for dietary requirements.
- **Events & Parties Section:** Dedicated space for booking private functions.

## 🛠️ Tech Stack

- **HTML5:** Semantic structure (nav, section, article, footer).
- **CSS3:** CSS Variables (`:root`), Flexbox, CSS Grid, and Media Queries.
- **JavaScript:** Vanilla JS (No frameworks) for tab switching and scroll observations.

## 📋 How to Run

This is a static website. You can view it immediately:

1.  **Option A:** Open the `index.html` file directly in your web browser.
2.  **Option B:** Clone this repository and serve it using a simple local server (e.g., VS Code Live Server, Python `http.server`, or PHP built-in server).

## 🍛 Updating the Menu

The menu on the website is generated from **`menu.json`** — edit that file, not the menu HTML in `index.html`.

1. Edit `menu.json` (on GitHub, click the file → ✏️ pencil icon) and commit to `main`.
2. The **Build menu** GitHub Action regenerates the menu in `index.html` and commits it (about 30 seconds). Check its status under the repo's **Actions** tab.
3. Cloudflare deploys that commit automatically.

If the Action fails (red ✖ in the Actions tab), `menu.json` has a mistake — the log says what and where, e.g. `menu.json is not valid JSON (around line 16)`. The website stays unchanged until it's fixed.

**Item fields** (only `name` is required):

| Field | Example | Shown as |
|---|---|---|
| `name` | `"Paneer Tikka"` | Item name |
| `note` | `"4 pieces"` | Grey text after the name: *(4 pieces)* |
| `price` | `18.0` or `{"regular": 13.0, "large": 22.0}` | `$18.00` or `$13.00 / $22.00` |
| `priceSuffix` | `"each"` | `$1.50 each` |
| `description` | `"Cottage cheese marinated…"` | Text under the name |
| `badge` | `"Chef's Special"`, `"Vegetarian"` or `"Spicy"` | Coloured label above the name |

**Sections** have an `id` (lowercase, used for the tab), a `title` (tab label), and either `items` or `subsections` (each with a `title` and `items`). Optional: `note` (e.g. *Large size +$6.00 additional*) and `pricing` (the Lamb/Chicken price banner on Non-Veg Mains). Section order in the file = tab order on the site.

To preview locally, run `node scripts/build-menu.mjs` and open `index.html`.

## 🗂️ Project Structure

