import useLocalStorage from 'commons/components/utils/hooks/useLocalStorage';
import useLocalStorageItem from 'commons/components/utils/hooks/useLocalStorageItem';
import { LocalStorageContext } from 'components/app/providers/LocalStorageProvider';
import { useContext } from 'react';
import { MY_LOCAL_STORAGE_PREFIX, StorageKey } from 'utils/constants';

export default function useMyLocalStorage() {
  return useLocalStorage(MY_LOCAL_STORAGE_PREFIX);
}

export function useMyLocalStorageItem<T>(key: StorageKey, initialValue?: T) {
  return useLocalStorageItem(key, initialValue, MY_LOCAL_STORAGE_PREFIX);
}

export function useMyLocalStorageProvider() {
  return useContext(LocalStorageContext);
}
