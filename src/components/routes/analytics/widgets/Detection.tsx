import 'chartjs-adapter-moment';
import { Analytic } from 'models/entities/generated/Analytic';
import { FC } from 'react';
import { stringToColor } from 'utils/utils';
import Stacked from './Stacked';

const Detection: FC<{ analytic: Analytic }> = ({ analytic }) => {
  return <Stacked analytic={analytic} field="howler.detection" color={stringToColor} />;
};

export default Detection;
