import {
  Add,
  Check,
  Edit,
  LocalPolice,
  MoodBad,
  NewReleases,
  PsychologyAlt,
  Star,
  Timeline
} from '@mui/icons-material';
import {
  Backdrop,
  Box,
  Button,
  Chip,
  CircularProgress,
  Drawer,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import { blue, orange, pink, red, yellow } from '@mui/material/colors';
import api from 'api';
import useMyApi from 'components/hooks/useMyApi';
import type { Hit } from 'models/entities/generated/Hit';
import type { Labels } from 'models/entities/generated/Labels';
import type { FC } from 'react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

type LabelState = {
  category: keyof Labels;
  label: string;
};

const LABEL_TYPE = {
  insight: { icon: <PsychologyAlt fontSize="small" />, color: '#FFFFFF' }, //brain icon
  mitigation: { icon: <LocalPolice fontSize="small" />, color: blue[600] }, //police badge
  victim: { icon: <MoodBad fontSize="small" />, color: pink[400] }, //crime outline
  campaign: { icon: <Timeline fontSize="small" />, color: orange[900] }, //net graph?
  threat: { icon: <NewReleases fontSize="small" />, color: red[400] },
  operation: { icon: <Star fontSize="small" />, color: yellow[600] },
  generic: {},
  assignments: {}
};

const NewLabelForm: FC<{ handleSubmit: (label: LabelState) => Promise<void> }> = ({ handleSubmit }) => {
  const { t } = useTranslation();
  const [label, setLabel] = useState<string>('');
  const [category, setCategory] = useState<string>('generic');
  const [error, setError] = useState<string>('');

  const handleAdd = async () => {
    if (!label) {
      setError(t('hit.label.edit.add.error.empty'));
    } else {
      try {
        await handleSubmit({ label: label, category: category as keyof Labels });
        setLabel('');
      } catch (e) {
        setError(e.message);
      }
    }
  };

  return (
    <Stack spacing={1} direction="column">
      <FormControl>
        <InputLabel id="type-label" htmlFor="label-category" size="small">
          {t('hit.label.edit.add.category')}
        </InputLabel>
        <Select
          size="small"
          sx={{
            '#label-category': { display: 'flex', flexDirection: 'row', alignItems: 'center' },
            '.MuiListItemIcon-root': { minWidth: 36, marginLeft: '2px' }
          }}
          label={t('hit.label.edit.add.category')}
          id="label-category"
          labelId="type-label"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {Object.keys(LABEL_TYPE).map(key => (
            <MenuItem key={key} value={key}>
              <ListItemIcon>{LABEL_TYPE[key].icon ?? <Check sx={{ opacity: 0 }} />}</ListItemIcon>
              <ListItemText sx={{ textTransform: 'capitalize' }}>{key}</ListItemText>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Stack direction="row" spacing={1} alignItems="center">
        <FormControl fullWidth error={!!error}>
          <TextField
            label={t('hit.label.edit.add.label')}
            value={label}
            onChange={e => setLabel(e.currentTarget.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleAdd();
              } else if (error) {
                setError('');
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleAdd}>
                    <Add />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          <FormHelperText>{error}</FormHelperText>
        </FormControl>
      </Stack>
    </Stack>
  );
};

const HitLabels: FC<{ hit: Hit; setHit?: (newHit: Hit) => void; readOnly?: boolean }> = ({
  hit,
  setHit,
  readOnly = false
}) => {
  const { dispatchApi } = useMyApi();
  const { t } = useTranslation();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [loading, setLoading] = useState(false);
  const [labels, setLabels] = useState<LabelState[]>(
    Object.entries(hit.howler.labels)
      .map(([key, category]) => category.map(label => ({ category: key, label: label })))
      .reduce((prev, curr) => [...prev, ...curr])
  );

  const submitLabel = useCallback(
    async (label: LabelState) => {
      // label can't be added more than once
      if (labels.some(x => label.category === x.category && label.label === x.label)) {
        throw new Error(t('hit.label.edit.add.error.duplicate'));
      }

      setLoading(true);
      try {
        const updatedHit = await dispatchApi(
          api.hit.labels.put(hit.howler.id, label.category, { value: [label.label] })
        );

        setHit?.(updatedHit);
      } finally {
        setLoading(false);
      }
      setLabels([...labels, label]);
    },
    [dispatchApi, hit.howler.id, labels, setHit, t]
  );

  const deleteLabel = useCallback(
    async (label: LabelState) => {
      setLoading(true);
      try {
        const updatedHit = await dispatchApi(
          api.hit.labels.del(hit.howler.id, label.category, { value: [label.label] })
        );
        setHit?.(updatedHit);
      } finally {
        setLoading(false);
      }
      setLabels(labels.filter(x => !(label.category === x.category && label.label === x.label)));
    },
    [dispatchApi, hit.howler.id, labels, setHit]
  );

  useEffect(() => {
    if (hit.howler.labels) {
      setLabels(
        Object.entries(hit.howler.labels)
          .map(([key, category]) => category.map(label => ({ category: key, label: label })))
          .reduce((prev, curr) => [...prev, ...curr])
      );
    }
  }, [hit]);

  return (
    <Box sx={{ py: 1 }}>
      <Drawer
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        anchor="right"
        PaperProps={{ sx: { maxWidth: '90%', width: '500px' } }}
      >
        <Backdrop open={loading} sx={{ position: 'absolute', zIndex: theme => theme.zIndex.drawer + 1 }}>
          <CircularProgress color="inherit" />
        </Backdrop>
        <Stack direction="column" spacing={2} sx={{ p: 2 }}>
          <Typography variant="h4">{t('hit.label.edit')}</Typography>
          <Box>
            {labels.map(label => {
              const category = label.category.toLowerCase();

              return (
                <Tooltip title={t(`hit.label.category.${category}`)} key={label.label + hit.howler.id}>
                  <Chip
                    icon={LABEL_TYPE[category]?.icon ?? undefined}
                    variant="filled"
                    key={label.label + hit.howler.id}
                    size="small"
                    label={label.label}
                    onDelete={() => deleteLabel(label)}
                    sx={[
                      {
                        mr: 1,
                        mb: 1
                      },
                      LABEL_TYPE[category]?.color && {
                        '&, & svg': {
                          color: theme => theme.palette.getContrastText(LABEL_TYPE[category].color) + ' !important'
                        },
                        backgroundColor: LABEL_TYPE[category].color
                      }
                    ]}
                  />
                </Tooltip>
              );
            })}
          </Box>
          <NewLabelForm handleSubmit={submitLabel} />
        </Stack>
      </Drawer>
      {labels.map(label => {
        const category = label.category.toLowerCase();
        return (
          <Tooltip title={t(`hit.label.category.${category}`)} key={label.label + hit.howler.id}>
            <Chip
              icon={LABEL_TYPE[category]?.icon ?? undefined}
              key={label.label + hit.howler.id}
              variant="outlined"
              size="small"
              label={label.label}
              sx={[
                {
                  mr: 1
                },
                LABEL_TYPE[category]?.color && {
                  '&, & svg': {
                    color: theme => theme.palette.getContrastText(LABEL_TYPE[category].color) + ' !important'
                  },
                  backgroundColor: LABEL_TYPE[category].color
                }
              ]}
            />
          </Tooltip>
        );
      })}

      {!readOnly && (
        <Button onClick={() => setOpenDrawer(true)} startIcon={<Edit />} variant="outlined" size="small">
          <Trans i18nKey="hit.label" />
        </Button>
      )}
    </Box>
  );
};

export default memo(HitLabels);
