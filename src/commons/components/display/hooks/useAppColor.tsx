import * as colors from '@mui/material/colors';
import useAppTheme from 'commons/components/app/hooks/useAppTheme';
import { useMemo } from 'react';

type MuiColorType = keyof typeof colors;

type MuiColor = typeof colors.blue;

type MuiColorVariant = keyof typeof colors.blue;

export default function useAppColor(
  color: MuiColorType = 'grey',
  lightVariant: MuiColorVariant = 100,
  darkVariant: MuiColorVariant = 900
) {
  const { isDark } = useAppTheme();
  return useMemo(() => {
    return (colors[color] as MuiColor)[isDark ? darkVariant : lightVariant];
  }, [isDark, color, lightVariant, darkVariant]);
}
