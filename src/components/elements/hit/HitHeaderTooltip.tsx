import { Tooltip } from '@mui/material';
import { Hit } from 'models/entities/generated/Hit';
import { FC, memo, PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { ReactElement } from 'react-markdown/lib/react-markdown';

type HitHeaderTooltipProps = PropsWithChildren<{
  hit: Hit;
}>;

const HitHeaderTooltip: FC<HitHeaderTooltipProps> = ({ hit, children }) => {
  const { t } = useTranslation();

  return (
    <Tooltip
      placement="top"
      title={
        <div>
          <div>{hit.event?.provider ?? t('unknown')}</div>
          <div>
            {hit.organization?.name ?? t('unknown')} - {hit.organization?.id ?? t('unknown')}
          </div>
          {hit.threat?.tactic && (
            <div>
              {hit.threat.tactic.id} ({hit.threat.tactic.name})
            </div>
          )}
          {hit.threat?.technique && (
            <div>
              {hit.threat.technique.id} ({hit.threat.technique.name})
            </div>
          )}
        </div>
      }
    >
      {children as ReactElement}
    </Tooltip>
  );
};

export default memo(HitHeaderTooltip);
