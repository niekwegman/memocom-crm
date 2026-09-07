// Applies per-deployment branding (see BRAND_* config variables).
//
// Every client CRM runs the same image, so branding cannot be compiled in —
// it arrives at runtime via /client-config and is applied here.
//
// The accent is delivered as CSS custom properties rather than by rebuilding
// the theme object: twenty-ui resolves every accent through `var(--t-accent-*)`
// (see themeCssVariables.ts), so setting those variables rebrands the whole
// app, in both colour schemes, without touching a single component.
//
// They are set as INLINE STYLE ON THE ROOT ELEMENT deliberately. The defaults
// live in `.light` / `.dark` class rules which the ThemeProvider puts on that
// same element (applyToRoot), and an inline style is the only thing that
// reliably outranks a class rule on the element carrying it.

export type Branding = {
  name?: string | null;
  accent?: string | null;
  accentAlt?: string | null;
  navBackground?: string | null;
};

// Note: there is deliberately no logo/favicon setting here. The favicon and
// the sign-in logo already come from the WORKSPACE logo (see PageFavicon and
// SignInUpStandardContent) — per-workspace, editable in the UI, no redeploy.
// Setting it from here too would give one <link rel="icon"> two owners, with
// Helmet and this code overwriting each other depending on render order.

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

// The built-in name, used whenever a deployment sets no BRAND_NAME.
const DEFAULT_BRAND_NAME = 'Memocom CRM';

let brandName = DEFAULT_BRAND_NAME;

/**
 * The product name for this deployment. title-utils and the auth pages call
 * this rather than hardcoding a string, so one image can present itself as
 * OptiFin on one domain and Memocom on another.
 */
export const getBrandName = (): string => brandName;

const expand = (hex: string): string =>
  hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;

const rgbOf = (hex: string): [number, number, number] => {
  const h = expand(hex);
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
};

/** Mix towards white (amount 0..1) — used to build the lighter accent steps. */
const tint = (hex: string, amount: number): string => {
  const [r, g, b] = rgbOf(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

/** Mix towards black — used for the darker end in the dark scheme. */
const shade = (hex: string, amount: number): string => {
  const [r, g, b] = rgbOf(hex);
  const mix = (c: number) => Math.round(c * (1 - amount));
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};

const isDarkScheme = (): boolean =>
  document.documentElement.classList.contains('dark');

export const applyBranding = (branding: Branding | null | undefined): void => {
  if (!branding) return;

  if (branding.name?.trim()) {
    brandName = branding.name.trim();
    // The static <title> in index.html was rendered before config arrived.
    if (document.title === DEFAULT_BRAND_NAME) {
      document.title = brandName;
    }
  }

  const root = document.documentElement;
  const accent = branding.accent?.trim();
  const accentAlt = branding.accentAlt?.trim();

  // A malformed hex would otherwise produce invalid CSS and silently leave
  // the app half-branded, which is harder to diagnose than doing nothing.
  if (accent && HEX.test(accent)) {
    const dark = isDarkScheme();

    // Only the six "real" accent surfaces are overridden. The accent1..12
    // Radix ramp is left alone on purpose: generating a perceptually even
    // 12-step ramp from one hex needs a colour library and a lot of visual
    // QA, and those steps are only used for subtle fills.
    const steps: Record<string, string> = dark
      ? {
          '--t-accent-primary': shade(accent, 0.45),
          '--t-accent-secondary': shade(accent, 0.55),
          '--t-accent-tertiary': shade(accent, 0.7),
          '--t-accent-quaternary': shade(accent, 0.8),
          '--t-accent-accent3570': accent,
          '--t-accent-accent4060': accent,
        }
      : {
          '--t-accent-primary': tint(accent, 0.78),
          '--t-accent-secondary': tint(accent, 0.78),
          '--t-accent-tertiary': tint(accent, 0.9),
          '--t-accent-quaternary': tint(accent, 0.96),
          '--t-accent-accent3570': accent,
          '--t-accent-accent4060': accent,
        };

    for (const [name, value] of Object.entries(steps)) {
      root.style.setProperty(name, value);
    }

    // The accent tokens only colour soft surfaces. The blue people actually
    // SEE — checked checkboxes, radios, primary/light buttons, links, the
    // selected-nav border — is the palette alias `--t-color-blue`, used by
    // twenty-ui's component styles directly. Override the alias (and its
    // transparent hover companion) but NOT the blue1..12 ramp or the
    // `--t-tag-*` tokens, so record tags and colour ramps a user picked as
    // "blue" keep meaning blue. Known cosmetic trade-off: nav-item icons
    // explicitly configured with color 'blue' follow the brand too.
    const [r, g, b] = rgbOf(accent);

    root.style.setProperty('--t-color-blue', accent);
    root.style.setProperty(
      '--t-background-transparent-blue',
      `rgba(${r}, ${g}, ${b}, 0.12)`,
    );
  }

  // Dark navigation chrome: sets a variable and a root class; the actual
  // restyling lives in brand-nav.css as LOCAL token overrides scoped to the
  // sidebar and page-header containers — components keep reading their own
  // design tokens, we only redefine what those tokens mean inside the navy
  // regions. No component fights, and unset config keeps the light chrome.
  const navBackground = branding.navBackground?.trim();

  if (navBackground && HEX.test(navBackground)) {
    root.style.setProperty('--t-brand-nav-bg', navBackground);
    root.classList.add('brand-nav');
  }

  if (accentAlt && HEX.test(accentAlt)) {
    // Exposed for deployment-specific styling; not consumed by twenty-ui
    // itself, so it is additive rather than an override.
    root.style.setProperty('--t-brand-accent-alt', accentAlt);
  }

};

