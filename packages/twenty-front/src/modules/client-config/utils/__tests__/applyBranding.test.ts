import { applyBranding, getBrandName } from '../applyBranding';

const rootStyle = () => document.documentElement.style;

const reset = () => {
  document.documentElement.removeAttribute('style');
  document.documentElement.className = '';
  // Clear head BEFORE setting the title: assigning document.title creates a
  // <title> element in head, so wiping head afterwards would erase it again.
  document.head.innerHTML = '';
  document.title = 'Memocom CRM';
};

describe('applyBranding', () => {
  beforeEach(reset);

  it('does nothing when the deployment sets no branding', () => {
    applyBranding(null);

    expect(rootStyle().getPropertyValue('--t-accent-primary')).toBe('');
    expect(document.title).toBe('Memocom CRM');
  });

  it('recolours the interactive palette-blue alias, not the ramp or tags', () => {
    applyBranding({ accent: '#F36F21' });

    expect(rootStyle().getPropertyValue('--t-color-blue')).toBe('#F36F21');
    expect(rootStyle().getPropertyValue('--t-background-transparent-blue')).toMatch(/^rgba\(/);
    // The ramp and tag tokens stay untouched so user-picked "blue" stays blue.
    expect(rootStyle().getPropertyValue('--t-color-blue5')).toBe('');
    expect(rootStyle().getPropertyValue('--t-tag-background-blue')).toBe('');
  });

  it('overrides the accent CSS variables the theme reads', () => {
    applyBranding({ accent: '#0B2C5F' });

    // The strongest accent steps are the brand colour itself.
    expect(rootStyle().getPropertyValue('--t-accent-accent3570')).toBe(
      '#0B2C5F',
    );
    // The soft surfaces are tinted towards white, not left at Twenty's blue.
    expect(rootStyle().getPropertyValue('--t-accent-primary')).toMatch(/^rgb\(/);
    expect(rootStyle().getPropertyValue('--t-accent-quaternary')).toMatch(
      /^rgb\(/,
    );
  });

  it('produces lighter steps in light mode than in dark mode', () => {
    applyBranding({ accent: '#0B2C5F' });
    const light = rootStyle().getPropertyValue('--t-accent-primary');

    reset();
    document.documentElement.classList.add('dark');
    applyBranding({ accent: '#0B2C5F' });
    const dark = rootStyle().getPropertyValue('--t-accent-primary');

    expect(light).not.toBe(dark);
  });

  it('ignores a malformed accent rather than emitting invalid CSS', () => {
    // Half-applied branding is harder to diagnose than none at all.
    applyBranding({ accent: 'navy' });

    expect(rootStyle().getPropertyValue('--t-accent-accent3570')).toBe('');
  });

  it('accepts shorthand hex', () => {
    applyBranding({ accent: '#08F' });

    expect(rootStyle().getPropertyValue('--t-accent-accent3570')).toBe('#08F');
    expect(rootStyle().getPropertyValue('--t-accent-primary')).toMatch(/^rgb\(/);
  });

  it('sets the brand name and the document title', () => {
    applyBranding({ name: 'OptiFin' });

    expect(getBrandName()).toBe('OptiFin');
    expect(document.title).toBe('OptiFin');
  });

  it('does not clobber a title the app has already set', () => {
    document.title = 'Prospects - OptiFin';
    applyBranding({ name: 'OptiFin' });

    expect(document.title).toBe('Prospects - OptiFin');
  });


});
