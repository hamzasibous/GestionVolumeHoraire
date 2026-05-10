---
name: Academic Excellence Portal
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#40484f'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#707880'
  outline-variant: '#c0c7d0'
  surface-tint: '#006496'
  primary: '#004d75'
  on-primary: '#ffffff'
  primary-container: '#006699'
  on-primary-container: '#bfe0ff'
  inverse-primary: '#90cdff'
  secondary: '#8a5100'
  on-secondary: '#ffffff'
  secondary-container: '#fc9910'
  on-secondary-container: '#643900'
  tertiary: '#604403'
  on-tertiary: '#ffffff'
  tertiary-container: '#7a5c1c'
  on-tertiary-container: '#ffd78d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#90cdff'
  on-primary-fixed: '#001e31'
  on-primary-fixed-variant: '#004b72'
  secondary-fixed: '#ffdcbd'
  secondary-fixed-dim: '#ffb86e'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#693c00'
  tertiary-fixed: '#ffdea5'
  tertiary-fixed-dim: '#e9c176'
  on-tertiary-fixed: '#261900'
  on-tertiary-fixed-variant: '#5d4201'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  table-data:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  sidebar-width: 260px
  gutter: 24px
---

## Brand & Style

This design system is engineered to project stability, authority, and administrative efficiency for higher education management. The visual language balances the prestigious heritage of the institution with the functional requirements of a modern digital workspace. 

The style is **Corporate / Modern**, characterized by a rigorous adherence to grid systems, high information density, and a "function-over-decoration" philosophy. It aims to reduce cognitive load for administrators and students through clear visual hierarchies and a sober, trustworthy aesthetic. The interface uses generous whitespace not just for aesthetics, but to frame complex data sets and institutional workflows.

## Colors

The palette is derived directly from the institutional identity to foster a sense of belonging and officiality. 

- **Primary Blue:** Used for core navigational elements, primary actions, and branding. It represents the depth of knowledge and institutional trust.
- **Secondary Orange:** Reserved for interactive highlights, notifications, and status indicators that require immediate attention (e.g., pending tasks).
- **Institutional Gold:** Utilized for "Excellence" markers, honors, and specific decorative accents that tie back to the university's crest.
- **Neutrals:** A range of cool grays (Slate) provides the structural framework for the UI, ensuring that data remains the focal point without visual competition from the container.

## Typography

The design system utilizes **Inter** for all interface levels. Inter's tall x-height and exceptional legibility at small sizes make it the ideal choice for a data-heavy portal involving student records, schedules, and financial tables.

- **Headlines:** Set with tight tracking and bold weights to provide clear section anchors.
- **Body Text:** Uses a standard 14px size for dashboards to maximize content visibility while maintaining readability.
- **Data Tables:** Utilize a slightly reduced 13px size to allow for more columns and rows per viewport without sacrificing clarity.
- **Labels:** Small caps and increased letter spacing are applied to auxiliary labels (e.g., table headers) to distinguish them from interactive data.

## Layout & Spacing

This design system employs a **12-column fluid grid** for the main content area, paired with a fixed-width left navigation sidebar. 

The spacing logic follows an 8px base unit. 
- **Margins:** 24px margins provide a professional "breathing room" around the dashboard containers.
- **Density:** High density is achieved by using 8px padding within data components (tables, lists) while using larger 24px-40px gaps between major structural sections (cards, modules) to maintain a clean, organized hierarchy.
- **Sidebar:** A constant 260px presence on the left ensures critical navigation is always accessible.

## Elevation & Depth

To maintain an academic and "grounded" feel, the system avoids dramatic shadows or skeuomorphic effects. Instead, it uses **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface Levels:** The primary background is a very light gray (`#F8FAFC`). Cards and content containers are pure white (`#FFFFFF`).
- **Borders:** Subtle 1px borders in a light neutral (`#E2E8F0`) are the primary method for defining sections. 
- **Shadows:** When necessary for temporary overlays like dropdowns or modals, a very soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) is used to create a "lift" without appearing heavy or distracting.

## Shapes

The shape language is **Soft (0.25rem / 4px)**. 

This specific radius is chosen to soften the "institutional" rigidity of a grid-heavy layout while remaining professional. It avoids the playfulness of larger radii found in consumer apps, sticking instead to a geometric precision that feels intentional and engineered. 
- **Primary Buttons:** 4px radius.
- **Data Cards:** 8px (rounded-lg) for outer containers to provide a gentle distinction from the inner content.
- **Inputs:** 4px radius to ensure they feel like distinct, actionable slots within the layout.

## Components

### Data Tables
Tables are the heart of the portal. Use a white background with subtle zebra striping (light gray on even rows) to guide the eye. Row height should be fixed at 48px for standard density. Headers must be "sticky" and use the **Label-Caps** typography style with a subtle bottom border.

### Statistical Cards
Summary cards should display a primary metric (H2) and a secondary trend label. Use the **Secondary Orange** or **Institutional Gold** for icons within these cards to draw attention to key performance indicators (e.g., enrollment numbers).

### Progress Bars
Workload and completion bars use a dual-tone approach: a light gray track with a **Primary Blue** fill. For critical warnings (e.g., over-capacity workload), the fill color shifts to the Secondary Orange. The bars are thin (8px height) to remain unobtrusive within dense lists.

### Navigation Sidebar
The sidebar uses a dark-themed variant of the **Primary Blue** or a very dark slate to provide high contrast against the content area. Active states should be indicated by a solid left-border accent in Secondary Orange and a subtle background highlight.

### Input Fields
Forms use a minimalist "outlined" style. Focus states must use a 2px Primary Blue border to provide clear accessibility and user feedback during data entry.