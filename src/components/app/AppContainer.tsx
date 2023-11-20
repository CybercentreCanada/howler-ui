import FlexVertical from 'commons/addons/flexers/FlexVertical';
import { FC } from 'react';
import { Outlet } from 'react-router';
import AppDrawerProvider from './providers/AppDrawerProvider';

const AppContainer: FC = () => {
  return (
    <FlexVertical>
      <AppDrawerProvider>
        <Outlet />
      </AppDrawerProvider>
    </FlexVertical>
  );
};

export default AppContainer;
