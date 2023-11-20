import { Box, CircularProgress, useTheme } from '@mui/material';
import useAppBanner from 'commons/components/app/hooks/useAppBanner';
import PageCardCentered from 'commons/components/pages/PageCardCentered';
import TextDivider from 'components/elements/display/TextDivider';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import OAuthLogin from './auth/OAuthLogin';
import UserPassLogin from './auth/UserPassLogin';

export default function LoginScreen() {
  const theme = useTheme();
  const banner = useAppBanner();
  const { config } = useMyApiConfig();
  const loading = config.configuration === null;

  return (
    <PageCardCentered>
      <Box color={theme.palette.primary.main} fontSize="30pt">
        {banner}
      </Box>
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CircularProgress />
        </div>
      )}
      {config.configuration?.auth?.internal?.enabled && (
        <>
          <UserPassLogin />
          {config.configuration?.auth?.oauth_providers?.length > 0 && <TextDivider />}
        </>
      )}

      {config.configuration?.auth?.oauth_providers?.length > 0 && (
        <OAuthLogin providers={config.configuration?.auth?.oauth_providers} />
      )}
    </PageCardCentered>
  );
}
