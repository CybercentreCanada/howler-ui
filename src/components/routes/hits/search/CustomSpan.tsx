import { Stack } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import moment from 'moment';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

const CustomSpan: FC<{}> = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  return searchParams.get('span')?.endsWith('custom') ? (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <DateTimePicker
          sx={{ minWidth: '175px', flexGrow: 1, marginTop: 1 }}
          slotProps={{ textField: { size: 'small' } }}
          label={t('date.select.start')}
          value={moment(searchParams.get('startDate'))}
          maxDate={moment(searchParams.get('endDate'))}
          onChange={(newStartDate: moment.Moment) =>
            setSearchParams(params => {
              params.set('startDate', newStartDate?.toISOString());
              return params;
            })
          }
          ampm={false}
          disableFuture
        />

        <DateTimePicker
          sx={{ minWidth: '175px', flexGrow: 1, marginTop: 1 }}
          slotProps={{ textField: { size: 'small' } }}
          label={t('date.select.end')}
          value={moment(searchParams.get('endDate'))}
          minDate={moment(searchParams.get('startDate'))}
          onChange={(newEndDate: moment.Moment) =>
            setSearchParams(params => {
              params.set('endDate', newEndDate?.toISOString());
              return params;
            })
          }
          ampm={false}
          disableFuture
        />
      </Stack>
    </LocalizationProvider>
  ) : null;
};

export default CustomSpan;
