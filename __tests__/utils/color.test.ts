import {
  alpha,
  contrastRatio,
  isHexColor,
  meetsContrast,
  mix,
  parseHexColor,
  pickInk,
  relativeLuminance,
  toHexColor,
} from '@/utils/color';

describe('parseHexColor', () => {
  it('accepts 3, 4, 6 and 8 digit hex, with or without #', () => {
    expect(parseHexColor('#abc')).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc, a: 1 });
    expect(parseHexColor('abcd')).toEqual({ r: 0xaa, g: 0xbb, b: 0xcc, a: 0xdd / 255 });
    expect(parseHexColor(' #A1B2C3 ')).toEqual({ r: 0xa1, g: 0xb2, b: 0xc3, a: 1 });
    expect(parseHexColor('#11223344')).toEqual({ r: 0x11, g: 0x22, b: 0x33, a: 0x44 / 255 });
  });

  it('rejects malformed values without throwing', () => {
    for (const value of ['', '#12', '#12345', '#1234567', '#ggg', 'red', null, undefined]) {
      expect(parseHexColor(value)).toBeNull();
    }
    expect(isHexColor('#fff')).toBe(true);
    expect(isHexColor('fff')).toBe(true);
    expect(isHexColor('not-a-color')).toBe(false);
  });
});

describe('toHexColor', () => {
  it('rounds channels and drops opaque alpha', () => {
    expect(toHexColor({ r: 0, g: 127.5, b: 255, a: 1 })).toBe('#0080ff');
  });

  it('keeps translucent alpha as an 8 digit hex', () => {
    expect(toHexColor({ r: 255, g: 0, b: 0, a: 0x80 / 255 })).toBe('#ff000080');
  });
});

describe('mix', () => {
  it('interpolates toward the base and clamps the amount', () => {
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mix('#000', '#fff', -1)).toBe('#ffffff');
    expect(mix('#000', '#fff', 2)).toBe('#000000');
  });

  it('keeps alpha through a mix', () => {
    expect(mix('#ff0000ff', '#0000ff00', 0.5)).toBe('#80008080');
  });

  it('falls back to the valid operand for malformed colors', () => {
    expect(mix('not-a-color', '#123456', 0.5)).toBe('#123456');
    expect(mix('#123456', 'not-a-color', 0.5)).toBe('#123456');
    expect(mix('not-a-color', 'also-not', 0.5)).toBe('also-not');
  });
});

describe('alpha', () => {
  it('applies opacity as an rgba string', () => {
    expect(alpha('#123456', 0.5)).toBe('rgba(18, 52, 86, 0.5)');
    expect(alpha('#ff000080', 0.5)).toBe('rgba(255, 0, 0, 0.251)');
  });

  it('returns transparent for invalid colors', () => {
    expect(alpha('nope', 0.5)).toBe('transparent');
  });
});

describe('relativeLuminance / contrastRatio', () => {
  it('matches the WCAG anchors', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBe(1);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
  });

  it('returns the worst ratio for malformed input', () => {
    expect(relativeLuminance('nope')).toBe(0);
    expect(contrastRatio('nope', '#ffffff')).toBe(1);
    expect(meetsContrast('nope', '#ffffff', 4.5)).toBe(false);
  });

  it('reports AA for the theme text colours', () => {
    expect(contrastRatio('#171b20', '#f5f7f9')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#626d79', '#f5f7f9')).toBeGreaterThanOrEqual(4.5);
  });
});

describe('pickInk', () => {
  it('uses dark ink on light backgrounds and light ink on dark ones', () => {
    expect(pickInk('#ffffff')).toBe('#09101a');
    expect(pickInk('#f5f7f9')).toBe('#09101a');
    expect(pickInk('#000000')).toBe('#ffffff');
    expect(pickInk('#0b1220')).toBe('#ffffff');
  });

  it('does not default to white just because a fill is colourful', () => {
    expect(pickInk('#ffe066')).toBe('#09101a');
    expect(pickInk('#6cc7f5')).toBe('#09101a');
    expect(pickInk('#0082c9')).toBe('#09101a');
  });

  it('honours custom ink candidates', () => {
    expect(pickInk('#ffffff', { dark: '#222222', light: '#fafafa' })).toBe('#222222');
  });

  it('falls back to light ink for malformed backgrounds', () => {
    expect(pickInk('not-a-color')).toBe('#ffffff');
  });

  it('returns an AA pair whenever one exists', () => {
    for (const background of ['#ffffff', '#f5f7f9', '#000000', '#0e1114', '#0082c9', '#ffe066', '#6cc7f5', '#e9322d']) {
      expect(contrastRatio(pickInk(background), background)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
