import { Chip, Stack, Tooltip } from '@mui/material';
import useMyApiConfig from 'components/hooks/useMyApiConfig';
import { Hit } from 'models/entities/generated/Hit';
import moment from 'moment';
import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from 'utils/utils';
import { HitLayout } from './HitLayout';

const TIMESTAMP_MESSAGES = {
  default: 'retention.safe',
  warning: 'retention.warn',
  error: 'retention.error'
};

const HitTimestamp: FC<{ hit: Hit; layout: HitLayout }> = ({ hit, layout }) => {
  const { t } = useTranslation();
  const { config } = useMyApiConfig();

  const threshold = useMemo(
    () =>
      moment().subtract(
        config.configuration.system.retention?.limit_amount ?? 350,
        (config.configuration.system.retention?.limit_unit as moment.unitOfTime.DurationConstructor) ?? 'days'
      ),
    [config.configuration.system.retention?.limit_amount, config.configuration.system.retention?.limit_unit]
  );

  const timestamp = useMemo(() => hit.event?.created ?? hit.timestamp, [hit]);

  const color = useMemo<'default' | 'warning' | 'error'>(() => {
    if (moment(timestamp).isBefore(threshold.clone().add(2, 'weeks'))) {
      return 'error';
    }

    if (moment(timestamp).isBefore(threshold.clone().add(1, 'months'))) {
      return 'warning';
    }

    return 'default';
  }, [threshold, timestamp]);

  const duration = useMemo(() => {
    if (moment(timestamp).isBefore(threshold)) {
      return t('retention.imminent');
    }

    const diff = moment(timestamp).diff(threshold, 'seconds');
    const _duration = moment.duration(diff, 'seconds');

    return _duration.humanize();
  }, [t, threshold, timestamp]);

  return (
    <Tooltip
      title={t(TIMESTAMP_MESSAGES[color], {
        duration
      })}
    >
      <Chip
        color={color}
        label={
          <Stack
            direction="row"
            spacing={0.5}
            sx={{ '& > span:first-of-type': { display: { sm: 'none', lg: 'block' } } }}
          >
            <span>{'timestamp:'}</span>
            <span>{formatDate(timestamp)}</span>
          </Stack>
        }
        size={layout !== HitLayout.COMFY ? 'small' : 'medium'}
      />
    </Tooltip>
  );
};

export default HitTimestamp;
