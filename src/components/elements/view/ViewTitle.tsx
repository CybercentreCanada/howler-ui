import { Language, Lock, Person } from '@mui/icons-material';
import { Stack, Tooltip, Typography } from '@mui/material';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';

interface ViewTitleProps {
  title?: string;
  type?: string;
  query?: string;
}

export const ViewTitle: FC<ViewTitleProps> = ({ title, type, query }) => {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack direction="row" alignItems="center" spacing={1}>
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
    </Stack>
  );
};
