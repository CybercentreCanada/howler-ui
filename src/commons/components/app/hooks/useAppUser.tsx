import { useContext } from 'react';
import { AppUser, AppUserService } from '../AppUserService';
import { AppUserContext } from '../providers/AppUserProvider';

export default function useAppUser<U extends AppUser = AppUser, S extends AppUserService<U> = AppUserService<U>>(): S {
  return useContext(AppUserContext) as S;
}
