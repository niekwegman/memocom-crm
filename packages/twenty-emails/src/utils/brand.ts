// Product name used in transactional emails.
//
// Emails are rendered server-side, so they cannot use the frontend's
// applyBranding. The server sets this once at bootstrap from the BRAND_NAME
// config variable (see main.ts); every deployment that leaves BRAND_NAME
// unset keeps the built-in name.
//
// A module-level value rather than a prop threaded through every template:
// the brand is fixed for the lifetime of a process (it comes from deploy
// config, not from request context), and threading it through a dozen email
// components would touch far more code for no behavioural gain.

const DEFAULT_BRAND_NAME = 'Memocom CRM';

let brandName = DEFAULT_BRAND_NAME;

export const setEmailBrandName = (name: string | undefined | null): void => {
  if (name?.trim()) {
    brandName = name.trim();
  }
};

export const getEmailBrandName = (): string => brandName;
