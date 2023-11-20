import { Box, IconButton, LinearProgress, Stack, Tooltip } from '@mui/material';
import PageCenter from 'commons/components/pages/PageCenter';
import { useTranslation } from 'react-i18next';

import { EmotionJSX } from '@emotion/react/types/jsx-namespace';
import { Search } from '@mui/icons-material';
import { HowlerSearchResponse } from 'api/search';
import { TuiPhrase } from 'commons/addons/controls';
import { TuiList, TuiListItemOnSelect, TuiListItemRenderer } from 'commons/addons/lists';
import TuiSearchPagination from 'commons/addons/search/TuiSearchPagination';
import TuiSearchTotal from 'commons/addons/search/TuiSearchTotal';
import { TuiKeyboardParsedEvent } from 'commons/components/utils/keyboard';
import { FC } from 'react';

interface ItemManagerProps {
  aboveSearch?: EmotionJSX.Element;
  afterSearch?: EmotionJSX.Element;
  belowSearch?: EmotionJSX.Element;
  hasError: boolean;
  onPageChange: (nextOffset: number) => void;
  onSearch: () => void;
  onSelect?: TuiListItemOnSelect<unknown>;
  phrase: string;
  renderer: TuiListItemRenderer<unknown>;
  response: HowlerSearchResponse<unknown>;
  searchAdornment?: EmotionJSX.Element;
  searching: boolean;
  searchPrompt: string;
  setPhrase: (value: string) => void;
}

// eslint-disable-next-line comma-spacing
const ItemManager: FC<ItemManagerProps> = ({
  aboveSearch,
  afterSearch,
  belowSearch,
  hasError,
  onPageChange,
  onSearch,
  onSelect,
  phrase,
  renderer,
  response,
  searchAdornment,
  searching,
  searchPrompt,
  setPhrase
}) => {
  const { t } = useTranslation();

  return (
    <PageCenter maxWidth="1500px" textAlign="left" height="100%">
      <Stack spacing={1}>
        {aboveSearch}
        <Stack direction="row" spacing={1}>
          <Stack sx={{ flex: 1 }}>
            <TuiPhrase
              value={phrase}
              onChange={setPhrase}
              onKeyDown={({ event, isEnter }: TuiKeyboardParsedEvent) => {
                // Prevent HitAction from receiving key events from this component.
                event.stopPropagation();
                // If ENTER key, then go for it, search!
                if (isEnter) {
                  onSearch();
                }
              }}
              error={hasError}
              InputProps={{
                sx: {
                  pr: 1
                }
              }}
              startAdornment={
                <Tooltip title={t(searchPrompt)}>
                  <IconButton onClick={() => onSearch()}>
                    <Search />
                  </IconButton>
                </Tooltip>
              }
              endAdornment={searchAdornment}
            />
            {searching && (
              <LinearProgress
                sx={theme => ({
                  mt: -0.5,
                  borderBottomLeftRadius: theme.shape.borderRadius,
                  borderBottomRightRadius: theme.shape.borderRadius
                })}
              />
            )}
          </Stack>
          {afterSearch}
        </Stack>
        {response && (
          <Stack direction="row" alignItems="center" mt={0.5}>
            <TuiSearchTotal
              total={response.total}
              pageLength={response.items.length}
              offset={response.offset}
              sx={theme => ({ color: theme.palette.text.secondary, fontSize: '0.9em', fontStyle: 'italic' })}
            />
            <Box flex={1} />
            <TuiSearchPagination
              total={response.total}
              limit={response.rows}
              offset={response.offset}
              onChange={onPageChange}
            />
          </Stack>
        )}
        {belowSearch}
        <TuiList onSelection={onSelect}>{renderer}</TuiList>
      </Stack>
    </PageCenter>
  );
};

export default ItemManager;
