import {
  contrastFor,
  eventChipColors,
  eventChipColorsWithInk,
  eventChipInk,
  mixColor,
} from '@/features/calendar/utils/eventInk';
import { contrastRatio } from '@/utils/color';

describe('eventInk', () => {
  it('mixes RGB colors toward the theme surface', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixColor('#123456', '#ffffff', 0)).toBe('#ffffff');
    expect(mixColor('#123456', '#ffffff', 1)).toBe('#123456');
  });

  it('falls back to the surface for malformed calendar colors', () => {
    expect(mixColor('not-a-color', '#f5f5f5', 0.2)).toBe('#f5f5f5');
    expect(eventChipColors('not-a-color', '#f5f5f5', false)).toEqual({
      background: '#f5f5f5',
      border: '#f5f5f5',
      rail: '#f5f5f5',
    });
  });

  it('keeps the raw hue as the rail and uses a quieter fill', () => {
    const light = eventChipColors('#e9322d', '#ffffff', false);
    const dark = eventChipColors('#e9322d', '#1e1e1e', true);

    expect(light.rail).toBe('#e9322d');
    expect(dark.rail).toBe('#e9322d');
    expect(light.background).not.toBe('#e9322d');
    expect(dark.background).not.toBe(light.background);
  });

  it('returns AA ink for the tinted chip fill', () => {
    for (const [color, surface, dark] of [
      ['#e9322d', '#ffffff', false],
      ['#ffe066', '#ffffff', false],
      ['#3b82f6', '#171b20', true],
      ['#ffffff', '#171b20', true],
      ['#000000', '#ffffff', false],
    ] as const) {
      const chip = eventChipColorsWithInk(color, surface, dark);
      expect(contrastRatio(chip.text, chip.background)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(chip.textSecondary, chip.background)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('keeps the original chip shape plus an explicit ink helper', () => {
    const chip = eventChipColors('#3b82f6', '#ffffff', false);
    expect(chip).toEqual({
      background: expect.any(String),
      border: expect.any(String),
      rail: '#3b82f6',
    });
    expect(eventChipInk(chip.background).text).toBe('#09101a');
  });

  it('keeps the contrastFor shape but picks WCAG ink', () => {
    const pale = contrastFor('#ffe8a3');
    expect(pale.text).toBe('#09101a');
    expect(pale.subtext).toBe('rgba(9, 16, 26, 0.62)');
    expect(pale.border).toBe('rgba(9, 16, 26, 0.16)');
    expect(contrastRatio(pale.text, '#ffe8a3')).toBeGreaterThanOrEqual(4.5);

    const deep = contrastFor('#0b3d66');
    expect(deep.text).toBe('#ffffff');
    expect(deep.subtext).toBe('rgba(255, 255, 255, 0.85)');
    expect(deep.border).toBe('rgba(255, 255, 255, 0.35)');
    expect(contrastRatio(deep.text, '#0b3d66')).toBeGreaterThanOrEqual(4.5);
  });

  it('falls back to light ink for malformed solid event colors', () => {
    expect(contrastFor('not-a-color').text).toBe('#ffffff');
  });
});
