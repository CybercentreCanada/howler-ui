import { ApiConfigContext } from 'components/app/providers/ApiConfigProvider';
import { useContext } from 'react';

export default function useMyApiConfig() {
  return useContext(ApiConfigContext);
}
