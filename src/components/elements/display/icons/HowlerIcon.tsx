import { SvgIcon, SvgIconProps } from '@mui/material';
import useAppTheme from 'commons/components/app/hooks/useAppTheme';
import { FC } from 'react';
import { ReactComponent as HowlerIconDarkSvg } from './svg/howler-icon-darkmode.svg';
import { ReactComponent as HowlerIconLightSvg } from './svg/howler-icon-lightmode.svg';

const HowlerIcon: FC<SvgIconProps> = props => {
  const { isDark } = useAppTheme();
  return <SvgIcon component={isDark ? HowlerIconDarkSvg : HowlerIconLightSvg} inheritViewBox {...props} />;
};

export default HowlerIcon;
