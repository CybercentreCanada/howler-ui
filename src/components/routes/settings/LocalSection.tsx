import { ViewComfy, ViewCompact, ViewModule } from '@mui/icons-material';
import { Stack, TableCell, TableRow, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import useLocalStorageItem from 'commons/components/utils/hooks/useLocalStorageItem';
import { HitLayout } from 'components/elements/hit/HitLayout';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { StorageKey } from 'utils/constants';
import EditRow from './EditRow';
import SettingsSection from './SettingsSection';

const CELL_SX = { borderBottom: 0, paddingBottom: 0.5 };

const LocalSection: FC = () => {
  const { t } = useTranslation();
  const [compactJson, setCompactJson] = useLocalStorageItem(StorageKey.COMPACT_JSON, false);
  const [flattenJson, setFlattenJson] = useLocalStorageItem(StorageKey.FLATTEN_JSON, false);
  const [hitLayout, setHitLayout] = useLocalStorageItem(StorageKey.HIT_LAYOUT, false);

  return (
    <SettingsSection title={t('page.settings.local.title')} colSpan={3}>
      <EditRow
        titleKey="page.settings.local.compact.json"
        descriptionKey="page.settings.local.compact.json.description"
        value={compactJson}
        type="checkbox"
        onEdit={async value => setCompactJson(JSON.parse(value))}
      />
      <EditRow
        titleKey="page.settings.local.flatten.json"
        descriptionKey="page.settings.local.flatten.json.description"
        value={flattenJson}
        type="checkbox"
        onEdit={async value => setFlattenJson(JSON.parse(value))}
      />
      <TableRow>
        <TableCell sx={CELL_SX} style={{ whiteSpace: 'nowrap' }}>
          {t('page.settings.local.hits.layout')}
        </TableCell>
        <TableCell sx={CELL_SX} colSpan={2}>
          <ToggleButtonGroup size="small" value={hitLayout} exclusive onChange={(_, value) => setHitLayout(value)}>
            <ToggleButton value={HitLayout.DENSE}>
              <Stack direction="row" spacing={0.5}>
                <ViewCompact />
                <span>{t('page.settings.local.hits.layout.dense')}</span>
              </Stack>
            </ToggleButton>
            <ToggleButton value={HitLayout.NORMAL}>
              <Stack direction="row" spacing={0.5}>
                <ViewModule />
                <span>{t('page.settings.local.hits.layout.normal')}</span>
              </Stack>
            </ToggleButton>
            <ToggleButton value={HitLayout.COMFY}>
              <Stack direction="row" spacing={0.5}>
                <ViewComfy />
                <span>{t('page.settings.local.hits.layout.comfy')}</span>
              </Stack>
            </ToggleButton>
          </ToggleButtonGroup>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={3} sx={{ paddingTop: '0 !important' }}>
          <Typography variant="caption" color="text.secondary">
            {t('page.settings.local.hits.layout.description')}
          </Typography>
        </TableCell>
      </TableRow>
    </SettingsSection>
  );
};

export default LocalSection;
