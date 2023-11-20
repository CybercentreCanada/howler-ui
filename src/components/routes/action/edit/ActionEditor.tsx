import { Add, PlayCircleOutline, Save, Search } from '@mui/icons-material';
import Close from '@mui/icons-material/Close';
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  LinearProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import api from 'api';
import { TuiPhrase } from 'commons/addons/controls';
import FlexOne from 'commons/addons/flexers/FlexOne';
import useAppUser from 'commons/components/app/hooks/useAppUser';
import PageCenter from 'commons/components/pages/PageCenter';
import { TuiKeyboardParsedEvent } from 'commons/components/utils/keyboard';
import { FieldContext } from 'components/app/providers/FieldProvider';
import SocketBadge from 'components/elements/display/icons/SocketBadge';
import useMyApi from 'components/hooks/useMyApi';
import { difference } from 'lodash';
import { ActionOperation } from 'models/ActionTypes';
import { Operation } from 'models/entities/generated/Operation';
import { HowlerUser } from 'models/entities/HowlerUser';
import { FC, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router';
import { useSearchParams } from 'react-router-dom';
import { operationReady } from 'utils/actionUtils';
import ActionReportDisplay from '../shared/ActionReportDisplay';
import OperationEntry from '../shared/OperationEntry';
import QueryResultText from '../shared/QueryResultText';
import useMyActionFunctions from '../useMyActionFunctions';

const ActionEditor: FC = () => {
  const { t } = useTranslation();
  const { dispatchApi } = useMyApi();
  const { getHitFields } = useContext(FieldContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useParams();
  const location = useLocation();
  const { user } = useAppUser<HowlerUser>();

  const {
    response,
    setResponse,
    loading,
    setLoading,
    responseQuery,
    report,
    progress,
    onSearch,
    saveAction,
    submitAction
  } = useMyActionFunctions();

  const [operations, setOperations] = useState<ActionOperation[]>([]);
  const [name, setName] = useState('');
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [userOperations, setUserOperations] = useState<Operation[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const isCreate = useMemo(() => location.pathname.endsWith('/create'), [location]);
  const availableOperations = useMemo(
    () => operations.filter(o => !userOperations.some(uo => uo.operation_id === o.id)),
    [operations, userOperations]
  );

  // Handler for when search term value changes.
  const onValueChange = useCallback((value: string) => setQuery(value), []);

  // Handler for keyboard event in order to trigger search onEnter.
  const onKeyDown = useCallback(
    (parsedEvent: TuiKeyboardParsedEvent) => {
      if (parsedEvent.isEnter) {
        onSearch(query);
      }
    },
    [onSearch, query]
  );

  // Clean button handler.
  const onClear = useCallback(() => {
    setQuery('');
    setResponse(null);
  }, [setResponse]);

  const onActionChange = useCallback(
    (index: number) => (a: Operation) => {
      setUserOperations(_userActions => {
        _userActions.splice(index, 1, a);

        return [..._userActions];
      });
    },
    []
  );

  const onActionDelete = useCallback(
    (index: number) => () => setUserOperations(_userActions => _userActions.filter((_, _index) => _index !== index)),
    []
  );

  const _submitAction = useCallback(() => submitAction(query, userOperations), [query, submitAction, userOperations]);

  useEffect(() => {
    dispatchApi(api.action.operations.get())
      .then(_operations => _operations.filter(a => difference(a.roles, user.roles).length < 1))
      .then(setOperations);

    getHitFields().then(fields => setSuggestions(fields.map(f => f.key)));

    if (query) {
      onSearch(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchApi, getHitFields]);

  useEffect(() => {
    if (responseQuery && searchParams.get('query') !== responseQuery) {
      searchParams.set('query', responseQuery);

      setSearchParams(new URLSearchParams(searchParams), { replace: true });
    }
  }, [searchParams, responseQuery, setSearchParams]);

  useEffect(() => {
    if (params.id) {
      setLoading(true);
      dispatchApi(
        api.search.action.post({
          query: `action_id:${params.id}`,
          rows: 1
        }),
        { throwError: false }
      ).then(result => {
        if (!result) {
          setLoading(false);
          return;
        }

        const existingAction = result.items[0];
        setName(existingAction.name);
        setQuery(existingAction.query);
        searchParams.set('query', existingAction.query);
        setSearchParams(new URLSearchParams(searchParams), { replace: true });
        setUserOperations(existingAction.operations);
        setLoading(false);
        onSearch(query);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchApi, params.id]);

  return (
    <PageCenter maxWidth="1500px" textAlign="left" height="100%">
      <Stack spacing={1}>
        {params.id && (
          <TextField
            label={t('route.actions.name')}
            disabled={loading}
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}
        <Stack direction="row" justifyContent="space-between" alignItems="end" sx={{ mb: -1 }}>
          <Typography
            sx={theme => ({ color: theme.palette.text.disabled, fontStyle: 'italic', mb: 0.5 })}
            variant="body2"
          >
            {t('hit.search.prompt')}
          </Typography>
          <SocketBadge size="small" />
        </Stack>
        <TuiPhrase
          suggestions={suggestions}
          fullWidth
          autoComplete="off"
          value={query}
          onChange={onValueChange}
          onKeyDown={onKeyDown}
          startAdornment={
            <IconButton onClick={() => onSearch(query)}>
              <Search />
            </IconButton>
          }
          endAdornment={
            <IconButton onClick={onClear}>
              <Close />
            </IconButton>
          }
        />
        <Stack direction="row" alignItems="center" spacing={1}>
          {response && <QueryResultText count={response.total} query={query} />}
          <FlexOne />
          {!params.id && !isCreate && (
            <Button
              variant="outlined"
              size="small"
              startIcon={loading ? <CircularProgress size={16} /> : <PlayCircleOutline />}
              disabled={
                !response ||
                loading ||
                userOperations.length < 1 ||
                userOperations.some(
                  a =>
                    !operationReady(
                      a?.data,
                      operations.find(_a => _a.id === a.operation_id)
                    )
                )
              }
              onClick={_submitAction}
            >
              {t('route.actions.execute')}
            </Button>
          )}
          {(params.id || isCreate || report) && (
            <Button
              variant="outlined"
              size="small"
              startIcon={loading ? <CircularProgress size={16} /> : <Save />}
              disabled={
                loading ||
                userOperations.length < 1 ||
                userOperations.some(
                  a =>
                    !operationReady(
                      a?.data,
                      operations.find(_a => _a.id === a.operation_id)
                    )
                )
              }
              onClick={() => saveAction(name, responseQuery, userOperations)}
            >
              {t('route.actions.save')}
            </Button>
          )}
        </Stack>
        {loading &&
          (progress[1] > 0 ? (
            <LinearProgress
              variant="determinate"
              value={(progress[0] / progress[1]) * 100}
              valueBuffer={((progress[0] + 10) / progress[1]) * 100}
            />
          ) : (
            <LinearProgress />
          ))}
        {report && <ActionReportDisplay report={report} operations={operations} />}
      </Stack>
      {operations.length > 0 && (
        <Stack spacing={1} mt={1}>
          {userOperations.map((a, index) => {
            const operation = operations.find(_operation => _operation.id === a.operation_id);

            return (
              <OperationEntry
                key={a.operation_id}
                query={responseQuery}
                operation={operation}
                operations={[operation, ...availableOperations]}
                values={a.data}
                onChange={onActionChange(index)}
                onDelete={onActionDelete(index)}
              />
            );
          })}

          {userOperations.length < operations.length && (
            <Card variant="outlined" sx={{ flex: 1 }}>
              <CardContent sx={{ paddingBottom: '16px !important' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body1" color={!response && 'text.secondary'}>
                    {t('route.actions.operation.add')}
                  </Typography>
                  <IconButton
                    size="small"
                    disabled={!response}
                    onClick={() =>
                      setUserOperations(_userActions => [
                        ..._userActions,
                        {
                          operation_id: operations.find(a => !_userActions.some(_a => _a.operation_id === a.id)).id,
                          data: {}
                        }
                      ])
                    }
                  >
                    <Add />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Stack>
      )}
    </PageCenter>
  );
};

export default ActionEditor;
