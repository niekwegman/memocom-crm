import ReactDOM from 'react-dom/client';

import { App } from '@/app/components/App';
import '@/app/utils/setupMonacoEnvironment';
import { migrateTokenPairCookieToLocalStorage } from '@/auth/utils/migrateTokenPairCookieToLocalStorage';
import { applyBranding } from '@/client-config/utils/applyBranding';
import { REACT_APP_SERVER_BASE_URL } from '~/config';
import { hydrateMetadataStore } from '@/metadata-store/storage/metadataStoreStorage';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import 'react-loading-skeleton/dist/skeleton.css';
import 'twenty-ui/style.css';
import 'twenty-ui/theme-light.css';
import 'twenty-ui/theme-dark.css';
import './index.css';
import './brand-nav.css';

// TODO: REMOVE this after 2026-12-12 — temporary migration of tokenPair from the
// legacy cookie to localStorage (legacy cookie has a 180-day expiry).
migrateTokenPairCookieToLocalStorage();

const renderApp = () => {
  const root = ReactDOM.createRoot(
    document.getElementById('root') ?? document.body,
  );

  root.render(<App />);
};

// Per-deployment branding must land BEFORE the first render: the theme
// provider snapshots getComputedStyle(documentElement) into a JS theme object
// at mount (computeThemeFromCss), so CSS variables written after that are
// never re-read. A same-origin /client-config fetch is cheap; a short timeout
// and catch-all guarantee an unbranded deployment (or a slow server) still
// renders normally.
const applyBrandingBeforeRender = async (): Promise<void> => {
  try {
    const response = await fetch(
      `${REACT_APP_SERVER_BASE_URL}/client-config`,
      { signal: AbortSignal.timeout(3000) },
    );

    if (!response.ok) return;

    const clientConfig = await response.json();

    applyBranding(clientConfig?.branding);
  } catch {
    // No branding is always a safe render.
  }
};

Promise.allSettled([hydrateMetadataStore(), applyBrandingBeforeRender()]).then(
  renderApp,
  renderApp,
);
