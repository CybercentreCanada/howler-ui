import { SvgIcon, SvgIconProps } from '@mui/material';
import { ReactComponent as HowlerLogoSvg } from './svg/howler-logo.svg';

export default function HowlerLogo(props: SvgIconProps) {
  return <SvgIcon component={HowlerLogoSvg} inheritViewBox {...props} />;
}
