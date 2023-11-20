import { Card, CardProps } from '@mui/material';
import { FC, memo } from 'react';

const HowlerCard: FC<CardProps> = props => (
  <Card style={{ outline: 'none' }} elevation={props.variant !== 'outlined' ? 4 : 0} {...props} />
);

export default memo(HowlerCard);
