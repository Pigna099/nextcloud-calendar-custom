import { darkTheme, lightTheme, type Theme } from '@/theme';
import { parseHexColor, contrastRatio } from '@/utils/color';

const AA = 4.5;
const NON_TEXT = 3;

const themes: [string, Theme][] = [
  ['light', lightTheme],
  ['dark', darkTheme],
];

describe.each(themes)('%s theme palette', (_name, theme) => {
  const c = theme.colors;

  const surfaceKeys: (keyof typeof c)[] = [
    'background',
    'surface',
    'surfaceRaised',
    'card',
    'item',
    'tabBar',
    'headerBackground',
  ];

  it('keeps text tokens at WCAG AA on every surface', () => {
    for (const surface of surfaceKeys) {
      for (const text of ['text', 'textSecondary', 'textTertiary'] as const) {
        expect(
          contrastRatio(c[text], c[surface]),
        ).toBeGreaterThanOrEqual(AA);
      }
    }
  });

  it('keeps accent text at AA on canvas and cards', () => {
    for (const surface of ['background', 'surface'] as const) {
      for (const accent of ['primary', 'danger', 'warning', 'talk'] as const) {
        expect(contrastRatio(c[accent], c[surface])).toBeGreaterThanOrEqual(AA);
      }
    }
  });

  it('pairs each solid fill with an AA on-color', () => {
    for (const [fill, ink] of [
      ['primary', 'onPrimary'],
      ['danger', 'onDanger'],
      ['warning', 'onWarning'],
      ['talk', 'onTalk'],
    ] as const) {
      expect(contrastRatio(c[ink], c[fill])).toBeGreaterThanOrEqual(AA);
    }
    expect(c.primaryText).toBe(c.onPrimary);
  });

  it('pairs soft surfaces with AA text', () => {
    for (const [fill, ink] of [
      ['primarySoft', 'primarySoftText'],
      ['dangerSoft', 'dangerSoftText'],
      ['warningSoft', 'warningSoftText'],
      ['talkSoft', 'talkSoftText'],
    ] as const) {
      expect(contrastRatio(c[ink], c[fill])).toBeGreaterThanOrEqual(AA);
    }
  });

  it('gives controls a 3:1 boundary on every surface', () => {
    for (const surface of surfaceKeys) {
      expect(
        contrastRatio(c.borderStrong, c[surface]),
      ).toBeGreaterThanOrEqual(NON_TEXT);
    }
  });

  it('keeps a visibly blue brand family', () => {
    const primary = parseHexColor(c.primary);
    const talk = parseHexColor(c.talk);
    expect(primary).not.toBeNull();
    expect(talk).not.toBeNull();
    expect(primary!.b).toBeGreaterThan(primary!.r);
    expect(talk!.b).toBeGreaterThan(talk!.r);
  });

  it('keeps decorative borders quieter than control borders', () => {
    expect(contrastRatio(c.border, c.surface)).toBeLessThan(contrastRatio(c.borderStrong, c.surface));
    expect(contrastRatio(c.borderSubtle, c.surface)).toBeLessThanOrEqual(contrastRatio(c.border, c.surface));
  });

  it('raises surfaces above the canvas in both schemes', () => {
    // Light: cards are brighter than the canvas. Dark: cards are lighter than
    // the canvas too, so both rely on the same intuition.
    expect(contrastRatio(c.surface, c.background)).toBeGreaterThanOrEqual(1.05);
    expect(contrastRatio(c.surfaceRaised, c.background)).toBeGreaterThanOrEqual(
      contrastRatio(c.surface, c.background),
    );
  });

  it('uses an opaque shadow and a translucent scrim', () => {
    expect(parseHexColor(c.shadow)).not.toBeNull();
    expect(c.scrim).toMatch(/^rgba\(/);
  });
});
