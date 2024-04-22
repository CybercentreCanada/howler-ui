import { Box, Stack, Tab, Typography, useMediaQuery, useTheme } from '@mui/material';
import PageCenter from 'commons/components/pages/PageCenter';
import { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import BundleDocumentation from './BundleDocumentation';
import HitBannerDocumentation from './HitBannerDocumentation';
import HitLinksDocumentation from './HitLinksDocumentation';
import HitSchemaDocumentation from './HitSchemaDocumentation';
import HelpTabs from './components/HelpTabs';

const HitDocumentation: FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const useHorizontal = useMediaQuery(theme.breakpoints.down(1700));

  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') ?? 'schema');

  const onChange = useCallback(
    (_tab: string) => {
      setTab(_tab);
      searchParams.set('tab', _tab);
      setSearchParams(new URLSearchParams(searchParams));
    },
    [searchParams, setSearchParams]
  );

  return (
    <PageCenter margin={4} width="100%" maxWidth="1750px" textAlign="left">
      <Stack sx={{ flexDirection: useHorizontal ? 'column' : 'row', '& h1': { mt: 0 } }}>
        <HelpTabs value={tab}>
          <Tab
            label={<Typography variant="caption">{t('help.hit.schema.title')}</Typography>}
            value="schema"
            onClick={() => onChange('schema')}
          />
          <Tab
            label={<Typography variant="caption">{t('help.hit.banner.title')}</Typography>}
            value="header"
            onClick={() => onChange('header')}
          />
          <Tab
            label={<Typography variant="caption">{t('help.hit.bundle.title')}</Typography>}
            value="bundle"
            onClick={() => onChange('bundle')}
          />
          <Tab
            label={<Typography variant="caption">{t('help.hit.links.title')}</Typography>}
            value="links"
            onClick={() => onChange('links')}
          />
        </HelpTabs>
        <Box>
          {{
            bundle: () => <BundleDocumentation />,
            header: () => <HitBannerDocumentation />,
            links: () => <HitLinksDocumentation />,
            schema: () => <HitSchemaDocumentation />
          }[tab]()}
        </Box>
      </Stack>
    </PageCenter>
  );
};

export default HitDocumentation;
