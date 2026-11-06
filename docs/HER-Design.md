# Her Opportunity Portal - Design System (DESIGN.md)

This document outlines the core design language, components, and structural rules for the Her Opportunity Portal, ensuring a cohesive, modern, and accessible interface. These rules are derived directly from the approved UI reference materials[cite: 1, 2, 3, 4].

## 1. Color Palette

The interface relies on a clean, light-themed foundation accented by vibrant, user-engaging colors to highlight calls to action and key metrics[cite: 1, 2, 3, 4].

*   **App Background:** Light Gray/Off-White (e.g., `#F4F5F7` or `#F8F8F9`) to provide contrast against content cards[cite: 1, 4].
*   **Surface/Card Background:** Pure White (`#FFFFFF`) for all content containers, dashboard widgets, and profile modals[cite: 1, 2, 3, 4].
*   **Primary Accent (Brand):** Vibrant Purple/Indigo (e.g., `#6F42C1` or `#6366F1`) used for primary buttons, active tab states, and key metric highlights[cite: 1, 3, 4].
*   **Secondary/Status Accents:**
    *   **Success/Positive:** Soft Green for "Responsive Creator" badges, positive growth metrics, and specific card highlights[cite: 1, 2, 4].
    *   **Warning/Notice:** Soft Yellow/Orange for "Rising Star" or "Shining Star" badges[cite: 1].
    *   **Categorical Backdrops:** Pastel pinks, greens, and purple gradients utilized selectively for featured cards or premium listings to break visual monotony[cite: 2, 3].
*   **Typography Colors:**
    *   **Primary Text:** Dark Charcoal/Black (e.g., `#1F2937`) for headings and core data[cite: 1, 2, 3, 4].
    *   **Secondary Text:** Medium Gray (e.g., `#6B7280`) for subtitles, metadata, placeholders, and inactive states[cite: 1, 2, 3, 4].

## 2. Typography

A modern, highly legible sans-serif typeface (such as Inter, Roboto, or Poppins) must be used globally to maintain a clean aesthetic[cite: 1, 2, 3, 4].

*   **Headings (H1-H4):** Bold font weight, dark charcoal color. Used for page titles, card headers (e.g., "Creator's Statistics"), and major data points[cite: 1, 4].
*   **Body Text:** Regular weight. Used for descriptions, bios, and standard listing information[cite: 1, 2].
*   **Labels & Microcopy:** Small text (11px-13px), often in medium gray or styled as uppercase pills for categories (e.g., "TRAVEL", "COMEDY")[cite: 3].
*   **Metrics:** Large, bold typography for statistical numbers (e.g., "485K", "$7,800/month") paired with smaller secondary labels[cite: 1, 2, 4].

## 3. UI Components & Shapes

The design heavily utilizes rounded geometries and card-based containment to organize complex data[cite: 1, 2, 3, 4].

*   **Cards & Containers:** All primary content (profiles, jobs, charts) must be housed in white cards featuring border-radii of approximately 12px-16px[cite: 1, 2, 3, 4]. Cards must have a soft, diffuse drop shadow (e.g., `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05)`) to elevate them from the app background[cite: 1, 4].
*   **Buttons:**
    *   Primary Action Buttons (e.g., "Invite to Campaign", "Apply now"): Moderately rounded rectangles (approx. 8px border-radius) with solid background colors (Purple or Dark Gray) and white text[cite: 1, 2].
    *   Secondary Actions: Outlined buttons or icon-only buttons (e.g., heart/save icons) with soft borders[cite: 2].
*   **Tags & Badges:** Must utilize pill-shaped geometries (fully rounded corners, e.g., `border-radius: 9999px`). These include content category tags (with thin outlines), location tags, and status badges (with solid, soft-colored backgrounds)[cite: 2, 3].
*   **Avatars & Imagery:** User profile pictures must be perfectly circular[cite: 1, 2, 4]. Media thumbnails (videos/photos) should fill their grid containers with heavily rounded corners (approx. 12px)[cite: 1].

## 4. Layout & Structure

*   **Navigation:**
    *   **Simple Views (Discovery):** A clean top navigation bar containing the logo, primary route links (Creators, Campaigns), search functionality, and notification icons[cite: 1, 3].
    *   **Complex Views (Dashboards/Admin):** A fixed left-hand sidebar for navigation (Dashboard, Users, Roles & Permissions) paired with a top header for search and user profile access[cite: 4]. Sidebars are also used for persistent filter controls on search pages[cite: 2].
*   **Grids:**
    *   **Discovery Pages:** Responsive, multi-column grid layouts for displaying creator profiles or campaign cards symmetrically[cite: 2, 3].
    *   **Media Galleries:** Tight masonry or uniform grids for displaying creator portfolio items, with overlay text for views/likes positioned at the bottom of the thumbnail[cite: 1].
*   **Modals/Overlays:** Detailed views (such as a specific Creator's full profile and statistics) should open in expansive, centered modal windows or sliding side-panels with a clear "Close (X)" action, dimming the background content[cite: 1].
## Client-approved visual revision — 4 November 2026

The latest eight client screenshots supersede the earlier purple marketplace styling above. Use navy #071629 for the persistent sidebar and primary text; pink #F6AFE6 for primary actions and selected controls; off-white #FAFAF9 for the canvas; white surfaces with #DCE2EA borders. Primary buttons are pills with navy text. Sidebar selection is #172C42 with pink text. Cards have 20–24px corners and restrained shadows.

Discovery uses a full-width results area, collapsible filters, four creator columns on wide screens, and photo-first cards with names and niches below the photo. Creator details use a compact circular portrait header, contact action, horizontal metrics, portfolio sections, and background details. Keep profile interception and persistent navigation.

Reference screenshots are visual references, not a source of application data. Do not reproduce the external builder toolbar, non-saving demo banner, role-switcher, fabricated applications, unavailable analytics, or nonfunctional publishing controls.
