import {
  Button,
  Checkbox,
  CircularProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography
} from '@mui/material';
import useMyApi from 'components/hooks/useMyApi';
import { FC, useCallback, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useAppDrawer from '../hooks/useAppDrawer';
import { ViewContext } from '../providers/ViewProvider';

type SaveViewDrawerProps = {
  viewId?: string;
  title?: string;
  query?: string;
  parent?: string;
};

const SaveViewDrawer: FC<SaveViewDrawerProps> = ({ viewId, title = 'New View', query = 'howler.id:*', parent }) => {
  const { t } = useTranslation();
  const { dispatchApi } = useMyApi();
  const { addView, editView } = useContext(ViewContext);
  const { close } = useAppDrawer();

  const [loading, setLoading] = useState(false);
  const [includeParent, setIncludeParent] = useState(!!parent);
  const [newView, setView] = useState({
    title,
    query,
    type: 'personal'
  });

  const onEdit = useCallback((field: 'title' | 'query' | 'type', value: string) => {
    setView(_view => ({
      ..._view,
      [field]: value
    }));
  }, []);

  const onSubmit = useCallback(async () => {
    setLoading(true);

    try {
      if (viewId) {
        await dispatchApi(editView(viewId, newView.title, newView.query));
      } else {
        await dispatchApi(
          addView({
            ...newView,
            query: includeParent ? `(${parent}) AND ${newView.query}` : newView.query
          })
        );
      }
    } finally {
      setLoading(false);
      close();
    }
  }, [addView, close, dispatchApi, editView, includeParent, newView, parent, viewId]);

  return (
    <Stack direction="column" spacing={2} sx={{ mt: 2 }}>
      <Typography sx={{ maxWidth: '500px' }}>
        {t(`app.drawer.view.description.${viewId ? 'edit' : 'create'}`)}
      </Typography>
      <TextField
        label={t('app.drawer.view.title')}
        placeholder={t('app.drawer.view.title.placeholder')}
        disabled={loading}
        value={newView.title}
        onChange={e => onEdit('title', e.target.value)}
      />
      <TextField
        label={t('app.drawer.view.query')}
        placeholder={t('app.drawer.view.query.placeholder')}
        disabled={loading}
        value={newView.query}
        onChange={e => onEdit('query', e.target.value)}
      />
      {parent && (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title={t('app.drawer.view.parent.tooltip') + parent}>
            <Typography sx={{ maxWidth: '500px' }}>{t('app.drawer.view.parent')}</Typography>
          </Tooltip>
          <Checkbox
            disabled={loading}
            size="small"
            checked={includeParent}
            onChange={() => setIncludeParent(!includeParent)}
          />
        </Stack>
      )}
      {!viewId && (
        <ToggleButtonGroup
          sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}
          size="small"
          exclusive
          value={newView.type}
          disabled={loading}
          onChange={(__, _type) => {
            if (_type) {
              onEdit('type', _type);
            }
          }}
        >
          <ToggleButton sx={{ flex: 1 }} value="personal" aria-label="personal">
            {t('route.templates.personal')}
          </ToggleButton>
          <ToggleButton sx={{ flex: 1 }} value="global" aria-label="global">
            {t('route.templates.global')}
          </ToggleButton>
        </ToggleButtonGroup>
      )}
      <Button variant="contained" sx={{ alignSelf: 'end' }} disabled={loading} onClick={onSubmit}>
        {loading && <CircularProgress size="24px" sx={{ mr: 1 }} />}
        {t('button.save')}
      </Button>
    </Stack>
  );
};

export default SaveViewDrawer;
