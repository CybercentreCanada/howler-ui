import api from 'api';
import useMyApi from 'components/hooks/useMyApi';
import { HowlerUser } from 'models/entities/HowlerUser';
import { createContext, FC, PropsWithChildren, useCallback, useState } from 'react';

interface UserListContextType {
  users: { [id: string]: HowlerUser };
  fetchUsers: (ids: Set<string>) => void;
}

export const UserListContext = createContext<UserListContextType>(null);

const UserListProvider: FC<PropsWithChildren> = ({ children }) => {
  const { dispatchApi } = useMyApi();

  const [users, setUsers] = useState<{ [id: string]: HowlerUser }>({});

  const fetchUsers = useCallback(
    async (ids: Set<string>) => {
      ids.delete('Unknown');

      const idsToGet = Array.from(ids.values()).filter(id => !Object.keys(users).includes(id));

      if (idsToGet.length <= 0) {
        return;
      }

      const newUsers = (
        await dispatchApi(api.search.user.post({ query: `id:${[...idsToGet].join(' OR ')}` }), {
          throwError: false,
          logError: false,
          showError: false
        })
      )?.items?.reduce((dict, user) => ({ ...dict, [user.username]: user }), {});

      setUsers({
        ...users,
        ...newUsers
      });
    },
    [dispatchApi, users]
  );

  return <UserListContext.Provider value={{ users, fetchUsers }}>{children}</UserListContext.Provider>;
};

export default UserListProvider;
