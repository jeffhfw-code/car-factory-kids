export const colors = {
  primary: '#3FA9F5',
  accent: '#FFC93C',
  success: '#7BC950',
  danger: '#FF6B6B',
  background: '#F4F1ED',
  ink: '#2C3E50',
  inkSoft: '#5B6B7E',
  surface: '#FFFFFF',
  surfaceMuted: '#EDE7DE',
} as const;

export type ColorKey = keyof typeof colors;
