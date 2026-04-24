export const palettes = {
  mica: {
    background: '#F5F1EA',
    surface: '#FFFCF7',
    surfaceMuted: '#EAE1D6',
    surfaceStrong: '#F0E7DA',
    text: '#2E2A26',
    textMuted: '#6F675F',
    accent: '#D6B98C',
    accentStrong: '#9F7A45',
    accentSoft: '#E8D4B4',
    success: '#547A76',
    danger: '#C86B5A',
    border: '#DDD1C3',
  },
  midnight: {
    background: '#171919',
    surface: '#202424',
    surfaceMuted: '#2C3131',
    surfaceStrong: '#272C2C',
    text: '#F3EFE8',
    textMuted: '#B8B1A8',
    accent: '#D1B17C',
    accentStrong: '#F0CF9A',
    accentSoft: '#8E7651',
    success: '#7CB4A6',
    danger: '#E39D8F',
    border: '#3D4343',
  },
} as const;

export type PaletteName = keyof typeof palettes;
