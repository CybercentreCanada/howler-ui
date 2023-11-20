import { Close, Search } from '@mui/icons-material';
import { IconButton, ListItemText, MenuItem, Select, Stack } from '@mui/material';
import api from 'api';
import { TuiPhrase } from 'commons/addons/controls';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import Markdown from 'components/elements/display/Markdown';
import { difference } from 'lodash';
import { ActionOperation } from 'models/ActionTypes';
import { HowlerUser } from 'models/entities/HowlerUser';
import raw from 'raw.macro';
import { FC, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VALID_ACTION_TRIGGERS } from 'utils/constants';
import ActionReportDisplay from '../action/shared/ActionReportDisplay';
import OperationStep from '../action/shared/OperationStep';
import QueryResultText from '../action/shared/QueryResultText';

const OPERATION_VALUES = {
  category: 'generic',
  label: 'Some Label Value'
};

const ActionIntroductionDocumentation: FC = () => {
  const { i18n, t } = useTranslation();
  const { user } = useAppUser<HowlerUser>();

  const [operations, setOperations] = useState<ActionOperation[]>([]);
  useEffect(() => {
    api.action.operations
      .get()
      .then(_operations => _operations.filter(a => difference(a.roles, user.roles).length < 1))
      .then(setOperations)
      // eslint-disable-next-line no-console
      .catch(console.debug);
  }, [user.roles]);

  const md = useMemo(
    () =>
      i18n.language === 'en' ? raw(`./markdown/en/actionIntroduction.md`) : raw(`./markdown/fr/actionIntroduction.md`),
    [i18n.language]
  );

  return (
    <Markdown
      md={md}
      components={{
        action_count: <>{operations.length}</>,
        action_list: (
          <ul>
            {operations.map(operation => (
              <li>
                {t(`operations.${operation.id}`)} - {operation.description.short}
              </li>
            ))}
          </ul>
        ),
        tui_phrase: (
          <Stack spacing={1}>
            <TuiPhrase
              onChange={() => {}}
              fullWidth
              autoComplete="off"
              value="howler.id:*"
              startAdornment={
                <IconButton>
                  <Search />
                </IconButton>
              }
              endAdornment={
                <IconButton>
                  <Close />
                </IconButton>
              }
            />
            <QueryResultText count={134} query="howler.id:*" />
          </Stack>
        ),
        operation_select: (
          <Select value="add_label" size="small">
            {operations.map(_a => (
              <MenuItem key={_a.id} value={_a.id}>
                <ListItemText primary={t(_a.i18nKey) ?? _a.title} secondary={_a.description?.short} />
              </MenuItem>
            ))}
          </Select>
        ),
        operation_configuration: (
          <>
            {operations
              .find(operation => operation.id === 'add_label')
              ?.steps.map(step => (
                <OperationStep
                  key={Object.keys(step.args).join('')}
                  step={step}
                  query="howler.id:*"
                  values={OPERATION_VALUES}
                  setValues={() => {}}
                />
              ))}
          </>
        ),
        report: (
          <ActionReportDisplay
            report={{
              add_label: [
                {
                  query: 'howler.id:*',
                  outcome: 'skipped',
                  title: 'Skipped Hit with Label',
                  message: `These hits already have the label ${OPERATION_VALUES.label}.`
                },
                {
                  query: 'howler.id:*',
                  outcome: 'success',
                  title: 'Executed Successfully',
                  message: `Label '${OPERATION_VALUES.label}' added to category '${OPERATION_VALUES.category}' for all matching hits.`
                }
              ]
            }}
            operations={operations}
          />
        ),
        automation_options: (
          <>{VALID_ACTION_TRIGGERS.map(trigger => t(`route.actions.trigger.${trigger}`)).join(', ')}</>
        )
      }}
    />
  );
};

export default ActionIntroductionDocumentation;
