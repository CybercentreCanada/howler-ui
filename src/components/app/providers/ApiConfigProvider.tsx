import { ApiType } from 'models/entities/generated/ApiType';
import { createContext, FC, PropsWithChildren, useMemo, useState } from 'react';

export type ApiConfigContextType = {
  config: ApiType;
  setConfig: (config: ApiType) => void;
};

export const ApiConfigContext = createContext<ApiConfigContextType>(null);

const ApiConfigProvider: FC<PropsWithChildren> = ({ children }) => {
  const [config, setConfig] = useState<ApiType>({
    indexes: null,
    lookups: null,
    configuration: null,
    c12nDef: null
  });

  const context = useMemo(
    () => ({
      config,
      setConfig
    }),
    [config, setConfig]
  );

  return <ApiConfigContext.Provider value={context}>{children}</ApiConfigContext.Provider>;
};
export default ApiConfigProvider;
