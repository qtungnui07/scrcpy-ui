---
name: Neo-Kinetic
colors:
  surface: '#f9f9f7'
  surface-dim: '#dadad8'
  surface-bright: '#f9f9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f2'
  surface-container: '#eeeeec'
  surface-container-high: '#e8e8e6'
  surface-container-highest: '#e2e3e1'
  on-surface: '#1a1c1b'
  on-surface-variant: '#4e4633'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#7f7660'
  outline-variant: '#d1c5ac'
  surface-tint: '#735c00'
  primary: '#735c00'
  on-primary: '#ffffff'
  primary-container: '#ffd027'
  on-primary-container: '#705900'
  inverse-primary: '#efc110'
  secondary: '#086e00'
  on-secondary: '#ffffff'
  secondary-container: '#87f96e'
  on-secondary-container: '#087300'
  tertiary: '#ad2c4f'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffc7ce'
  on-tertiary-container: '#aa2a4c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffe087'
  primary-fixed-dim: '#efc110'
  on-primary-fixed: '#231a00'
  on-primary-fixed-variant: '#574500'
  secondary-fixed: '#8afc71'
  secondary-fixed-dim: '#6edf58'
  on-secondary-fixed: '#012200'
  on-secondary-fixed-variant: '#045300'
  tertiary-fixed: '#ffd9dd'
  tertiary-fixed-dim: '#ffb2bd'
  on-tertiary-fixed: '#400014'
  on-tertiary-fixed-variant: '#8c1038'
  background: '#f9f9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e2e3e1'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.5'
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 48px
  gutter: 24px
  margin: 40px
---

## Brand & Style
The design system adopts a **Neubrutalist** aesthetic tailored for a high-performance desktop environment. It balances raw, industrial structural elements with a vibrant, optimistic palette. The brand personality is unapologetic, high-energy, and tactile.

The visual language is defined by:
- **Maximum Contrast:** Intentional use of pure black (#000000) for all structural lines.
- **Physicality:** Elements appear as physical slabs stacked on a workspace, utilizing hard shadows instead of gradients to imply depth.
- **Controlled Chaos:** A playful "anti-design" philosophy that remains professional through strict alignment and consistent stroke weights.

## Colors
The palette utilizes a high-saturation functional approach against a neutral, "Paper" background (#F8F8F6). 

- **Primary (Canary Yellow):** Used for main actions and focus states.
- **Accents:** Neon Green (Success), Bubblegum Pink (Decline/Error), Electric Lavender (Secondary Actions), and Sky Blue (Information/Links).
- **Structure:** All borders, shadows, and primary text must use the absolute black (#000000) to maintain the "comic-book" industrial aesthetic.

## Typography
The system uses **Space Grotesk** exclusively to leverage its technical, geometric character which complements the thick border weights.

- **Headlines:** Set with tight tracking and heavy weights. 
- **Body:** Medium weight is preferred over Regular to ensure legibility against high-contrast borders.
- **Labels:** Uppercase styling is used for buttons and category tags to reinforce the "industrial label" feel.

## Layout & Spacing
The layout follows a strict **12-column fixed grid** on desktop. 

- **Padding:** Elements use generous internal padding to ensure the heavy 3px borders do not "choke" the content.
- **The 4px Rule:** All spacing and hard shadows should be multiples of 4px to align with the shadow offset (4px 4px).
- **Stacking:** For desktop toolbars and sidebars, use "detached" panels (cards with shadows) rather than flat background splits to maintain the object-oriented aesthetic.

## Elevation & Depth
This design system rejects traditional blurs and Z-axis depth. 

- **Hard Shadows:** All interactive or elevated elements (Cards, Buttons, Modals) must feature a **4px 4px 0px #000000** drop shadow.
- **Active State:** On click or press, the element should translate **2px 2px** toward the shadow, and the shadow should shrink to **2px 2px 0px #000000** to simulate physical compression.
- **Borders:** A consistent **3px solid #000000** stroke is applied to all component boundaries.

## Shapes
The shape language combines geometric rigor with "chunky" softened corners to prevent the UI from feeling too aggressive.

- **Cards:** 16px radius for large containers.
- **Interactive Elements:** 12px radius for buttons, inputs, and icon containers.
- **Micro-elements:** 8px radius for badges, tags, and checkboxes.
- **Folder Tabs:** For tabbed interfaces, the top-left and top-right corners should retain the 16px radius, while the bottom corners remain sharp (0px) to dock into the container.

## Components

### Buttons
- **Style:** Primary buttons use Canary Yellow (#FFD027) with a 3px black border and hard shadow. 
- **Typography:** Bold, uppercase Space Grotesk.
- **Hover:** The button background shifts to Neon Green or Sky Blue.

### Folder-Tab Cards
- **Structure:** A main card body with a 16px radius. At the top, a "tab" extends upward, styled with the same 3px border and 16px top-corner radius.
- **Content:** Use Sky Blue or Electric Lavender for the tab background to categorize content types.

### Chunky Sliders & Toggles
- **Sliders:** The track is a 3px black outline with a soft cream fill. The "thumb" is a large 24x24px circle or square with a primary color fill and a hard shadow.
- **Toggles:** Rectangular with 8px radius. When "On," the background is Neon Green; when "Off," it is the background cream. The switch handle is a chunky square.

### Input Fields
- **Style:** 3px black border, 12px radius.
- **Focus:** The border remains 3px, but the background shifts from white to a very pale version of Sky Blue.

### Badges & Chips
- **Style:** 8px radius, 2px border (slightly thinner for micro-copy), bold labels. Use the full accent palette for color-coding.