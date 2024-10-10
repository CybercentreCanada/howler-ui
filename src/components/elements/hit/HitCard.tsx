import { CardContent } from '@mui/material';
import type { RecievedDataType } from 'components/app/providers/SocketProvider';
import { SocketContext } from 'components/app/providers/SocketProvider';
import { uniqueId } from 'lodash';
import type { Hit } from 'models/entities/generated/Hit';
import type { HitUpdate } from 'models/socket/HitUpdate';
import type { FC } from 'react';
import { memo, useCallback, useContext, useEffect, useState } from 'react';
import HowlerCard from '../display/HowlerCard';
import HitBanner from './HitBanner';
import HitLabels from './HitLabels';
import { HitLayout } from './HitLayout';
import HitOutline from './HitOutline';

const HitCard: FC<{ hit: Hit; layout: HitLayout; readOnly?: boolean; useListener?: boolean }> = ({
  hit: _hit,
  layout,
  readOnly = true,
  useListener = false
}) => {
  const { addListener, removeListener } = useContext(SocketContext);

  const [hit, setHit] = useState<Hit>(_hit);

  const handler = useCallback(
    (data: RecievedDataType<HitUpdate>) => {
      if (data.hit?.howler.id === hit.howler.id) {
        setHit(data.hit);
      }
    },
    [hit.howler.id]
  );

  useEffect(() => {
    setHit(_hit);
  }, [_hit, _hit.howler.id]);

  useEffect(() => {
    if (!hit || !useListener) {
      return;
    }

    const _id = uniqueId();
    addListener<HitUpdate>(_id, handler);

    return () => removeListener(_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handler, hit?.howler?.id]);

  return (
    <HowlerCard tabIndex={0} sx={{ position: 'relative' }}>
      <CardContent>
        <HitBanner hit={hit} layout={layout} />
        {layout !== HitLayout.DENSE && (
          <>
            <HitOutline hit={hit} layout={layout} />
            <HitLabels hit={hit} setHit={setHit} readOnly={readOnly} />
          </>
        )}
      </CardContent>
    </HowlerCard>
  );
};

export default memo(HitCard);
