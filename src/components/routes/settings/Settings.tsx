import useAppUser from 'commons/components/app/hooks/useAppUser';
import UserPageWrapper from 'components/elements/display/UserPageWrapper';
import useMyLocalStorage from 'components/hooks/useMyLocalStorage';
import useMyUserFunctions from 'components/hooks/useMyUserFunctions';
import { HowlerUser } from 'models/entities/HowlerUser';
import { FC, useCallback, useMemo } from 'react';
import { StorageKey } from 'utils/constants';
import ProfileSection from './ProfileSection';
import SecuritySection from './SecuritySection';

const Settings: FC = () => {
  const { user: currentUser, setUser } = useAppUser<HowlerUser>();
  const { editName, editPassword, editQuota, addApiKey, removeApiKey, addRole, removeRole, viewGroups } =
    useMyUserFunctions();

  const { get } = useMyLocalStorage();

  const isOAuth = useMemo(() => get<string>(StorageKey.APP_TOKEN)?.includes('.'), [get]);

  const currentUserWrapper = useCallback(
    (fn: (user: HowlerUser, newValue: unknown) => Promise<HowlerUser>) => {
      return async (value: unknown) => setUser(await fn(currentUser, value));
    },
    [currentUser, setUser]
  );

  return (
    <UserPageWrapper user={currentUser}>
      <ProfileSection
        user={currentUser}
        editName={!isOAuth && currentUserWrapper(editName)}
        addRole={currentUser.is_admin && !isOAuth && currentUserWrapper(addRole)}
        removeRole={currentUser.is_admin && !isOAuth && currentUserWrapper(removeRole)}
        viewGroups={viewGroups}
      />
      <SecuritySection
        user={currentUser}
        editPassword={editPassword}
        addApiKey={addApiKey}
        removeApiKey={currentUserWrapper(removeApiKey)}
        editQuota={currentUser.is_admin && currentUserWrapper(editQuota)}
      />
    </UserPageWrapper>
  );
};

export default Settings;
