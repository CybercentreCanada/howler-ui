import { MenuItem, MenuList, MenuListProps } from '@mui/material';
import { KeyboardEvent, memo, useMemo } from 'react';
import { AppSearchItem } from '../app/AppSearchService';
import useAppSearchService from '../app/hooks/useAppSearchService';

import AppListEmpty from '../display/AppListEmpty';
import { parseEvent } from '../utils/keyboard';

type AppSearchResultProps = MenuListProps;

const AppSearchResult = ({ className, ...menuProps }: AppSearchResultProps) => {
  const { state, service } = useAppSearchService();

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, item: AppSearchItem) => {
    const { isEnter, isEscape } = parseEvent(event);
    if (isEnter) {
      if (service.onItemSelect) {
        if (state.mode === 'fullscreen') state.set({ ...state, mode: 'inline', menu: false });
        service.onItemSelect(item, state);
      }
    } else if (isEscape) {
      state.set({ ...state, menu: false });
    }
  };

  const options = useMemo(
    () =>
      state.items?.reduce(
        (_options, item, index) => ({
          ..._options,
          [index]: { state, index, last: index === state.items.length - 1 }
        }),
        {}
      ),

    [state]
  );

  return (
    <div className={className}>
      {state.mode === 'inline' && service.headerRenderer && service.headerRenderer(state)}
      <MenuList data-tui-id="tui-app-search-result" {...menuProps}>
        {state.items?.length > 0 ? (
          state.items.map((item, index) => (
            <MenuItem key={item.id} onKeyDown={event => onKeyDown(event, item)}>
              {service.itemRenderer(item, options[index])}
            </MenuItem>
          ))
        ) : state.items ? (
          <AppListEmpty />
        ) : null}
      </MenuList>
      {state.mode === 'inline' && service.footerRenderer && service.footerRenderer(state)}
    </div>
  );
};

export default memo(AppSearchResult);
