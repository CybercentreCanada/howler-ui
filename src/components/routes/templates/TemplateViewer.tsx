import {
  Alert,
  Button,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip
} from '@mui/material';
import api from 'api';
import PageCenter from 'commons/components/pages/PageCenter';
import TemplateEditor from 'components/routes/templates/TemplateEditor';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Check, Delete, Remove, SsidChart } from '@mui/icons-material';
import hitsData from 'api/hit/:id/data/index.json';
import AppInfoPanel from 'commons/components/display/AppInfoPanel';
import { TemplateContext } from 'components/app/providers/TemplateProvider';
import HitDetails, { DEFAULT_FIELDS } from 'components/elements/hit/HitDetails';
import { HitLayout } from 'components/elements/hit/HitLayout';
import useMyApi from 'components/hooks/useMyApi';
import _ from 'lodash';
import type { Analytic } from 'models/entities/generated/Analytic';
import type { Hit } from 'models/entities/generated/Hit';
import type { Template } from 'models/entities/generated/Template';
import { useSearchParams } from 'react-router-dom';
import { sanitizeLuceneQuery } from 'utils/stringUtils';

const CUSTOM_OUTLINES = ['cmt.aws.sigma.rules', 'assemblyline', '6tailphish'];

const TemplateViewer = () => {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const { getTemplates } = useContext(TemplateContext);
  const { dispatchApi } = useMyApi();

  const [templateList, setTemplateList] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(null);
  const [displayFields, setDisplayFields] = useState<string[]>([]);

  const [analytics, setAnalytics] = useState<Analytic[]>([]);
  const [detections, setDetections] = useState<string[]>([]);

  const [analytic, setAnalytic] = useState<string>(params.get('analytic') ?? '');
  const [detection, setDetection] = useState<string>(params.get('detection') ?? 'ANY');
  const [type, setType] = useState<string>((params.get('type') ?? 'personal').replace('readonly', 'global'));
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    dispatchApi(api.search.analytic.post({ query: 'analytic_id:*', rows: 1000 }), {
      logError: false,
      showError: true,
      throwError: true
    })
      .finally(() => setLoading(false))
      .then(result => result.items)
      .then(_analytics => {
        if (!_analytics.some(_analytic => _analytic.name.toLowerCase() === analytic.toLowerCase())) {
          setAnalytic('');
        }

        setAnalytics(_analytics);
      });

    getTemplates().then(setTemplateList);
  }, [analytic, dispatchApi, getTemplates]);

  useEffect(() => {
    if (analytic) {
      setLoading(true);

      dispatchApi(
        api.search.grouped.hit.post('howler.detection', {
          limit: 0,
          query: `howler.analytic:"${sanitizeLuceneQuery(analytic)}"`
        }),
        {
          logError: false,
          showError: true,
          throwError: true
        }
      )
        .finally(() => setLoading(false))
        .then(result => result.items.map(i => i.value))
        .then(_detections => {
          if (_detections.length < 1 || (type === 'global' && CUSTOM_OUTLINES.includes(analytic.toLowerCase()))) {
            setDetection('ANY');
          }

          if (detection && !_detections.includes(detection)) {
            setDetection('ANY');
          }

          setDetections(_detections);
        });
    }
  }, [analytic, detection, dispatchApi, params, setParams, type]);

  useEffect(() => {
    if (analytic && detection) {
      const template = templateList.find(
        _template =>
          _template.analytic === analytic &&
          ((detection === 'ANY' && !_template.detection) || _template.detection === detection) &&
          _template.type === type
      );

      if (template) {
        setSelectedTemplate(template);
        setDisplayFields(template.keys);
      } else {
        setSelectedTemplate(null);
        setDisplayFields(DEFAULT_FIELDS);
      }
    }
  }, [analytic, detection, templateList, type]);

  useEffect(() => {
    if (analytic) {
      params.set('analytic', analytic);
    } else {
      params.delete('analytic');
    }

    if (detection && detection !== 'ANY') {
      params.set('detection', detection);
    } else {
      params.delete('detection');
    }

    params.set('type', type);

    params.sort();

    setParams(params, {
      replace: true
    });
  }, [analytic, detection, params, setParams, type]);

  const exampleHit = useMemo<Hit>(() => {
    const _hit = hitsData.GET[Object.keys(hitsData.GET)[0]];

    if (analytic) {
      _hit.howler.analytic = analytic;
    }

    return { ..._hit };
  }, [analytic]);

  const onDelete = useCallback(async () => {
    await dispatchApi(api.template.del(selectedTemplate.template_id), {
      logError: false,
      showError: true,
      throwError: false
    });
    setSelectedTemplate(null);
    setDisplayFields(DEFAULT_FIELDS);
  }, [dispatchApi, selectedTemplate?.template_id]);

  const onSave = useCallback(async () => {
    if (analytic && detection) {
      try {
        setTemplateLoading(true);

        const result = await dispatchApi(
          selectedTemplate
            ? api.template.put(selectedTemplate.template_id, displayFields)
            : api.template.post({
                analytic,
                detection: detection !== 'ANY' ? detection : null,
                type,
                keys: displayFields
              }),
          {
            logError: false,
            showError: true,
            throwError: true
          }
        );

        setSelectedTemplate(result);
        const newList = [result, ...templateList];
        setTemplateList(newList.filter((v1, i) => newList.findIndex(v2 => v1.template_id === v2.template_id) === i));
      } finally {
        setTemplateLoading(false);
      }
    }
  }, [analytic, detection, dispatchApi, displayFields, selectedTemplate, templateList, type]);

  const isCustomOutline = useMemo(() => CUSTOM_OUTLINES.includes(analytic.toLowerCase()), [analytic]);
  const analyticOrDetectionMissing = useMemo(() => !analytic || !detection, [analytic, detection]);
  const noFieldChange = useMemo(
    () => displayFields.length < 1 || _.isEqual(selectedTemplate?.keys ?? DEFAULT_FIELDS, displayFields),
    [displayFields, selectedTemplate?.keys]
  );

  return (
    <PageCenter maxWidth="1500px" textAlign="left" height="100%">
      <LinearProgress sx={{ mb: 1, opacity: +loading }} />
      <Stack direction="column" spacing={2} divider={<Divider orientation="horizontal" flexItem />} height="100%">
        <Stack direction="row" spacing={2} mb={2} alignItems="stretch">
          <FormControl sx={{ minWidth: { sm: '200px' } }}>
            <InputLabel id="analytic-label" htmlFor="analytic" size="small">
              {t('route.templates.analytic')}
            </InputLabel>
            <Select
              labelId="analytic-label"
              id="analytic"
              size="small"
              label={t('route.templates.analytic')}
              value={analytics.length > 0 ? analytic : ''}
              onChange={e => setAnalytic(e.target.value)}
            >
              {analytics
                .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
                .map(s => (
                  <MenuItem key={s.analytic_id} value={s.name}>
                    {s.name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          {!(detections?.length < 2 && detections[0]?.toLowerCase() === 'rule') ? (
            <FormControl
              sx={{ minWidth: { sm: '200px' } }}
              disabled={!analytic || (isCustomOutline && type === 'global')}
            >
              <InputLabel id="detection-label" htmlFor="detection" size="small">
                {t('route.templates.detection')}
              </InputLabel>
              <Select
                labelId="detection-label"
                id="detection"
                size="small"
                label={t('route.templates.detection')}
                value={isCustomOutline && type === 'global' ? 'ANY' : detection ?? ''}
                onChange={e => setDetection(e.target.value)}
              >
                <MenuItem value="ANY">{t('any')}</MenuItem>
                {detections.sort().map(s => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <Tooltip title={t('route.templates.rule.explanation')}>
              <SsidChart color="info" sx={{ alignSelf: 'center' }} />
            </Tooltip>
          )}
          <ToggleButtonGroup
            sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}
            size="small"
            exclusive
            value={type}
            disabled={analyticOrDetectionMissing}
            onChange={(__, _type) => {
              if (_type) {
                setType(_type);
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
          {selectedTemplate && (
            <Button variant="outlined" startIcon={<Delete />} onClick={onDelete}>
              {t('button.delete')}
            </Button>
          )}
          <Button
            variant="outlined"
            disabled={analyticOrDetectionMissing || (isCustomOutline && type === 'global') || noFieldChange}
            startIcon={
              templateLoading ? (
                <CircularProgress size={16} />
              ) : isCustomOutline && type === 'global' ? (
                <Remove />
              ) : (
                <Check />
              )
            }
            onClick={onSave}
          >
            {t(
              isCustomOutline && type === 'global'
                ? 'button.readonly'
                : !analyticOrDetectionMissing && !noFieldChange
                  ? 'button.save'
                  : 'button.saved'
            )}
          </Button>
        </Stack>
        {isCustomOutline && type === 'global' ? (
          <HitDetails hit={exampleHit} layout={HitLayout.COMFY} type="global" />
        ) : analyticOrDetectionMissing ? (
          <AppInfoPanel i18nKey="route.templates.select" sx={{ width: '100%', alignSelf: 'start' }} />
        ) : (
          <TemplateEditor
            hit={exampleHit}
            fields={displayFields}
            onAdd={field => setDisplayFields([...displayFields, field])}
            onRemove={field => setDisplayFields(displayFields.filter(f => f !== field))}
          />
        )}
      </Stack>
    </PageCenter>
  );
};

export default TemplateViewer;
