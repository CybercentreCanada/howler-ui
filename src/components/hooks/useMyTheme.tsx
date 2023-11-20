import { AppThemeConfigs } from 'commons/components/app/AppConfigs';

// const LEGACY_THEME = {
//   palette: {
//     // dark: {
//     //   background: {
//     //     default: '#303030',
//     //     paper: '#303030'
//     //   },
//     //   secondary: {
//     //     main: '#fd5d1c'
//     //   }
//     // },
//     light: {
//       background: {
//         default: '#fafafa',
//         paper: '#fff'
//       }
//     }
//   }
// };

// const DARK_BLUE_THEME = {
//   palette: {
//     dark: {
//       background: {
//         default: 'rgb(0, 30, 60)',
//         paper: 'rgb(0, 30, 60)'
//       },
//       secondary: {
//         main: '#fd5d1c'
//       }
//     }
//   }
// };

const DEFAULT_THEME = {
  appbar: {
    light: {
      color: 'black',
      backgroundColor: 'white'
    }
  }
};

export default function useMyTheme(): AppThemeConfigs {
  // return LEGACY_THEME;
  // return DARK_BLUE_THEME;
  return DEFAULT_THEME;
}
