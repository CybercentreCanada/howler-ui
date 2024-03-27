import { Check } from '@mui/icons-material';
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import api from 'api';
import TuiButton from 'commons/addons/display/buttons/TuiButton';
import { ViewContext } from 'components/app/providers/ViewProvider';
import { Analytic } from 'models/entities/generated/Analytic';
import { HowlerUser } from 'models/entities/HowlerUser';
import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const TYPES = {
  view: ['viewId', 'limit'],
  analytic: ['analyticId', 'type']
};

const VISUALIZATIONS = ['assessment', 'created', 'escalation', 'status', 'detection'];

const AddNewCard: FC<{ dashboard: HowlerUser['dashboard']; addCard: (newCard) => void }> = ({ dashboard, addCard }) => {
  const { t } = useTranslation();
  const { views } = useContext(ViewContext);

  const [selectedType, setSelectedType] = useState<'' | 'view' | 'analytic'>('');
  const [analytics, setAnalytics] = useState<Analytic[]>([]);
  const [config, _setConfig] = useState<{ [index: string]: any }>({});

  const setConfig = useCallback((key: string, value: any) => _setConfig(_config => ({ ..._config, [key]: value })), []);

  const _addCard = useCallback(() => {
    if (!selectedType) {
      return;
    }

    addCard({
      entry_id: selectedType === 'view' ? config.viewId : `${config.analyticId}-${config.type}`,
      type: selectedType,
      config: JSON.stringify(config)
    });
  }, [addCard, config, selectedType]);

  useEffect(() => {
    api.search.analytic.post({ query: '*:*' }).then(result => setAnalytics(result.items));
  }, []);

  useEffect(() => {
    if (selectedType === 'view') {
      _setConfig({
        limit: 3
      });
    } else {
      _setConfig({});
    }
  }, [selectedType]);

  return (
    <Grid item xs={12} md={6}>
      <Card variant="outlined" sx={{ height: '100%' }}>
        <CardHeader
          title={t('route.home.add')}
          subheader={
            <Typography variant="body2" color="text.secondary">
              {t('route.home.add.description')}
            </Typography>
          }
        />
        <CardContent>
          <Stack spacing={1}>
            <FormControl sx={theme => ({ mt: `${theme.spacing(2)} !important` })}>
              <InputLabel>{t('route.home.add.type')}</InputLabel>
              <Select
                value={selectedType}
                onChange={event => setSelectedType(event.target.value as any)}
                label={t('route.home.add.type')}
              >
                {Object.keys(TYPES).map(type => (
                  <MenuItem key={type} value={type}>
                    <Stack>
                      <Typography variant="body1">{t(`route.home.add.type.${type}`)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t(`route.home.add.type.${type}.description`)}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedType && <Divider flexItem />}
            {selectedType === 'analytic' && (
              <>
                <Typography variant="body1">{t('route.home.add.analytic.title')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('route.home.add.analytic.description')}
                </Typography>
                <Autocomplete
                  sx={{ pt: 1 }}
                  onChange={(__, opt) => setConfig('analyticId', opt.analytic_id)}
                  options={analytics}
                  filterOptions={(options, state) =>
                    options.filter(
                      opt =>
                        opt.name.toLowerCase().includes(state.inputValue.toLowerCase()) ||
                        opt.description?.split('\n')[0]?.toLowerCase().includes(state.inputValue.toLowerCase())
                    )
                  }
                  renderOption={(props, option) => (
                    <li {...props} key={option.analytic_id}>
                      <Stack>
                        <Typography variant="body1">{option.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.description?.split('\n')[0]}
                        </Typography>
                      </Stack>
                    </li>
                  )}
                  getOptionLabel={option => option.name}
                  renderInput={params => <TextField {...params} label={t('route.home.add.analytic')} />}
                />
                <FormControl sx={theme => ({ mt: `${theme.spacing(2)} !important` })}>
                  <InputLabel>{t('route.home.add.visualization')}</InputLabel>
                  <Select
                    value={config.type ?? ''}
                    onChange={event => setConfig('type', event.target.value as any)}
                    label={t('route.home.add.visualization')}
                  >
                    {VISUALIZATIONS.map(viz => (
                      <MenuItem key={viz} value={viz}>
                        <Stack>
                          <Typography variant="body1">{t(`route.home.add.visualization.${viz}`)}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t(`route.home.add.visualization.${viz}.description`)}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
            {selectedType === 'view' && (
              <>
                <Autocomplete
                  sx={{ pt: 1 }}
                  onChange={(__, opt) => setConfig('viewId', opt.view_id)}
                  options={views}
                  filterOptions={(options, state) =>
                    options.filter(
                      opt =>
                        !dashboard?.find(
                          entry => entry.type === 'view' && JSON.parse(entry.config).viewId === opt.view_id
                        ) &&
                        (opt.title.toLowerCase().includes(state.inputValue.toLowerCase()) ||
                          opt.query.toLowerCase().includes(state.inputValue.toLowerCase()))
                    )
                  }
                  renderOption={(props, option) => (
                    <li {...props} key={option.view_id}>
                      <Stack>
                        <Typography variant="body1">{t(option.title)}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.query}
                        </Typography>
                      </Stack>
                    </li>
                  )}
                  getOptionLabel={option => t(option.title)}
                  renderInput={params => <TextField {...params} label={t('route.home.add.view')} />}
                />
                <Typography variant="body1" sx={{ pt: 1 }}>
                  {t('route.home.add.limit')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('route.home.add.limit.description')}
                </Typography>
                <Box sx={{ px: 0.5 }}>
                  <Slider
                    value={config.limit ?? 3}
                    valueLabelDisplay="auto"
                    onChange={(_, value: number) => setConfig('limit', value)}
                    min={1}
                    max={10}
                    step={1}
                    marks
                  />
                </Box>
              </>
            )}
            <Stack direction="row" justifyContent="end">
              <TuiButton
                variant="outlined"
                size="small"
                color="primary"
                startIcon={<Check />}
                disabled={!selectedType || TYPES[selectedType]?.filter(field => !config[field]).length > 0}
                onClick={_addCard}
              >
                {t('create')}
              </TuiButton>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default AddNewCard;
