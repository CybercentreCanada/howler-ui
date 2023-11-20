import { Box, Drawer, Stack, useMediaQuery, useTheme } from '@mui/material';
import FlexPort from 'commons/addons/flexers/FlexPort';
import { TuiListItemOnSelect, TuiListProvider } from 'commons/addons/lists';
import useTuiListItems from 'commons/addons/lists/hooks/useTuiListItems';
import PageCenter from 'commons/components/pages/PageCenter';
import { Hit } from 'models/entities/generated/Hit';
import { FC, memo, ReactNode, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import api from 'api';
import HowlerCard from 'components/elements/display/HowlerCard';
import HitHeader from 'components/elements/hit/HitHeader';
import { HitLayout } from 'components/elements/hit/HitLayout';
import { useParams } from 'react-router';
import HitPanel from './HitPanel';
import HitSearch from './HitSearch';

const Wrapper = memo<{ show: boolean; isMd: boolean; children: ReactNode; onClose: () => void }>(
  ({ show, isMd, children, onClose }) =>
    isMd ? (
      <Drawer
        onClose={onClose}
        open={show}
        anchor="right"
        PaperProps={{ sx: { backgroundImage: 'none', width: '90%' } }}
      >
        {children}
      </Drawer>
    ) : (
      <Box style={{ flex: 1 }}>{children}</Box>
    )
);

const HitBrowser: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMd = useMediaQuery(theme.breakpoints.down('lg'));
  const { items } = useTuiListItems<Hit>();
  const location = useLocation();
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const item = items.find(i => i.selected);
  const hit = item?.item;
  const [show, setShow] = useState(item?.selected);
  const [bundleHit, setBundleHit] = useState<Hit>(null);

  useEffect(() => setShow(!!hit || item?.selected), [hit, hit?.howler?.id, item?.selected]);

  useEffect(() => {
    if (location.pathname.startsWith('/bundles') && params.id) {
      api.hit.get(params.id).then(setBundleHit);
    } else {
      setBundleHit(null);
    }
  }, [location.pathname, params.id]);

  const onSelection: TuiListItemOnSelect<Hit> = useCallback(
    selection => {
      if (selection.item.howler.is_bundle) {
        navigate(`/bundles/${selection.item.howler.id}?query=`);
      } else {
        searchParams.set('selected', selection.item.howler.id);
        setSearchParams(new URLSearchParams(searchParams));
      }
    },
    [navigate, searchParams, setSearchParams]
  );

  const onClose = useCallback(() => {
    searchParams.delete('selected');
    setSearchParams(new URLSearchParams(searchParams));
  }, [searchParams, setSearchParams]);

  return (
    <Stack direction="row" flex={1}>
      <FlexPort>
        <PageCenter textAlign="left" mt={0} ml={0} mr={0}>
          {bundleHit && (
            <HowlerCard
              sx={[
                { mx: -1, p: 1, border: '4px solid transparent', cursor: 'pointer' },
                location.pathname.startsWith('/bundles') &&
                  !searchParams.has('selected') && { borderColor: theme.palette.primary.main }
              ]}
              onClick={bundleHit && !!hit && !hit.howler.is_bundle ? onClose : undefined}
            >
              <HitHeader hit={bundleHit} layout={HitLayout.DENSE} useListener />
            </HowlerCard>
          )}
          <HitSearch top={0} onSelection={onSelection} />
        </PageCenter>
      </FlexPort>
      <Wrapper show={show} isMd={isMd} onClose={() => setShow(false)}>
        <HitPanel onClose={bundleHit && !!hit && !hit.howler.is_bundle && onClose} />
      </Wrapper>
    </Stack>
  );
};

const HitBrowserProvider: FC = () => {
  return (
    <TuiListProvider>
      <HitBrowser />
    </TuiListProvider>
  );
};

export default HitBrowserProvider;
