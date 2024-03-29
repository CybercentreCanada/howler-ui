import type { SvgIconProps } from '@mui/material';
import { SvgIcon } from '@mui/material';
import type { FC } from 'react';

const HowlerIconSvg: FC<SvgIconProps> = props => {
  return (
    <SvgIcon id="artwork" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64.08 64.08" {...props}>
      <svg>
        <defs>
          <style>{`.cls-1{fill:url(#radial-gradient);}.cls-2{fill:#0e4377;}`}</style>
          <radialGradient id="radial-gradient" cx="32.04" cy="32.04" r="32.04" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1976d2" />
            <stop offset="0.51" stopColor="#1975d0" />
            <stop offset="0.7" stopColor="#1871c9" />
            <stop offset="0.83" stopColor="#176bbe" />
            <stop offset="0.93" stopColor="#1561ad" />
            <stop offset="1" stopColor="#13599e" />
          </radialGradient>
        </defs>
        <path
          className="cls-1"
          d="M64.08,32a32,32,0,1,0-48,27.8C19.77,55.6,22.57,49,21.37,44.1a23.48,23.48,0,0,0-2.22-5.92v0h0c.07.52.13,1,.17,1.59.39,5.69-1.77,10.48-4.81,10.69-2.35.16-4.55-2.46-5.6-6.28,0,0,.06.1.08.15a16.16,16.16,0,0,1-.7-3.81c-.39-5.7,1.77-10.48,4.81-10.69a3.35,3.35,0,0,1,1.92.49l5.33-5.69s4.06-3.85,7.52-2.57A10.33,10.33,0,0,0,38.3,20.63a43.59,43.59,0,0,1,6.82-4,2.73,2.73,0,0,1,2.57-1.82c2.09-.11,4.1,2.72,2.68,5.11,0,0,2.53,4.66,2.17,6.93v.05h0c.06.46.6,4.71-1.65,7.29-2,2.33-14.39,13.48-11.2,28.91h0l-.16.12h0A32,32,0,0,0,64.08,32Z"
        />
        <path
          className="cls-2"
          d="M17.5,33.09a13.87,13.87,0,0,1,.68,1.45A6.66,6.66,0,0,1,17.5,33.09Zm1.83,6.71c0-.54-.1-1.07-.17-1.59-.14,5.08-3.05,9-5.86,9.23-1.65.12-3.23-1.15-4.38-3.23,1.05,3.82,3.25,6.44,5.6,6.28C17.56,50.28,19.72,45.49,19.33,39.8ZM29,28.44l2-1.89s.54-.44.21-.83a3.07,3.07,0,0,0-2.78-1.31C27.88,25.61,29,28.44,29,28.44Zm3.61,13,4.85.27A36.35,36.35,0,0,0,33.59,50l3.25-.71c-.68,6.56,2.86,13.76,2.86,13.76-3.19-15.43,9.17-26.58,11.2-28.91,2.38-2.73,1.64-7.34,1.64-7.34S48.81,35.29,32.59,41.41Z"
        />
      </svg>
    </SvgIcon>
  );
};

export default HowlerIconSvg;
