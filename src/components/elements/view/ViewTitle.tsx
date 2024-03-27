import { ArrowDownward, ArrowUpward, Language, Lock, Person } from '@mui/icons-material';
import { Chip, Stack, Tooltip, Typography } from '@mui/material';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { convertLucenceToDate } from 'utils/utils';

interface ViewTitleProps {
  title?: string;
  type?: string;
  query?: string;
  sort?: string;
  span?: string;
}

export const ViewTitle: FC<ViewTitleProps> = ({ title, type, query, sort, span }) => {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack direction="row" alignItems="start" spacing={1}>
        <Tooltip title={t(`route.views.manager.${type}`)}>
          {
            {
              readonly: <Lock fontSize="small" />,
              global: <Language fontSize="small" />,
              personal: <Person fontSize="small" />
            }[type]
          }
        </Tooltip>
        <Typography variant="body1">{t(title)}</Typography>
      </Stack>
      <Typography variant="caption">
        <code>{query}</code>
      </Typography>
      {(sort || span) && (
        <Stack direction="row" sx={{ mt: 1 }} spacing={1}>
          {sort?.split(',').map(_sort => (
            <Chip
              size="small"
              label={_sort.split(' ')[0]}
              icon={_sort.endsWith('desc') ? <ArrowDownward /> : <ArrowUpward />}
            />
          ))}
          {span && <Chip size="small" label={t(convertLucenceToDate(span))} />}
        </Stack>
      )}
    </Stack>
  );
};
