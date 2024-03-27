import { AccountTree } from '@mui/icons-material';
import { IconButton, Paper, Popover, Skeleton, Stack, Tooltip } from '@mui/material';
import api from 'api';
import HowlerCard from 'components/elements/display/HowlerCard';
import HitHeader from 'components/elements/hit/HitHeader';
import { HitLayout } from 'components/elements/hit/HitLayout';
import { Hit } from 'models/entities/generated/Hit';
import { FC, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

const BundleParentMenu: FC<{ bundle: Hit }> = ({ bundle }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [parentAnchor, setParentAnchor] = useState<HTMLElement>(null);

  const [parentHits, setParentHits] = useState<Hit[]>([]);

  const onSelect = useCallback(
    (bundleId: string) => {
      navigate(`/bundles/${bundleId}?span=date.range.all&query=howler.id%3A*`);
      setParentAnchor(null);
    },
    [navigate]
  );

  useEffect(() => {
    if (!parentAnchor) {
      return;
    }

    api.search.hit
      .post({ query: `howler.id:(${bundle.howler.bundles.join(' OR ')})` })
      .then(response => setParentHits(response.items));
  }, [bundle.howler.bundles, parentAnchor]);

  return (
    <>
      <Tooltip title={t('hit.bundle.parents.show')}>
        <IconButton size="small" onClick={event => setParentAnchor(event.currentTarget)}>
          <AccountTree fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!parentAnchor}
        anchorEl={parentAnchor}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        onClose={() => setParentAnchor(null)}
      >
        <Paper sx={{ p: 1, minWidth: '750px' }}>
          <Stack spacing={1}>
            {parentHits.length < 1
              ? bundle.howler.bundles.map(id => <Skeleton key={id} variant="rounded" height="100px" />)
              : parentHits.map(parent => (
                  <HowlerCard
                    key={parent.howler.id}
                    sx={{ p: 1, cursor: 'pointer' }}
                    onClick={() => onSelect(parent.howler.id)}
                  >
                    <HitHeader hit={parent} layout={HitLayout.DENSE} />
                  </HowlerCard>
                ))}
          </Stack>
        </Paper>
      </Popover>
    </>
  );
};

export default BundleParentMenu;
