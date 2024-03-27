import { useTheme } from '@mui/material';
import 'chartjs-adapter-moment';
import { Analytic } from 'models/entities/generated/Analytic';
import { FC } from 'react';
import { STATUS_COLORS } from 'utils/constants';
import Stacked from './Stacked';

const Status: FC<{ analytic: Analytic }> = ({ analytic }) => {
  const theme = useTheme();

  return (
    <Stacked
      analytic={analytic}
      field="howler.status"
      color={status => (status === 'on-hold' ? theme.palette.grey : theme.palette[STATUS_COLORS[status]].main)}
    />
  );
};

export default Status;
