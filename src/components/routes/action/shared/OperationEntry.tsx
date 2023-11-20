import { Delete } from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack
} from '@mui/material';
import Markdown from 'components/elements/display/Markdown';
import { ActionOperation } from 'models/ActionTypes';
import { Operation } from 'models/entities/generated/Operation';
import { FC, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { checkArgsAreFilled, operationReady } from 'utils/actionUtils';
import OperationStep from './OperationStep';

const OperationEntry: FC<{
  query: string;
  operation: ActionOperation;
  readonly?: boolean;
  values?: { [index: string]: string };
  operations: ActionOperation[];
  onChange?: (operation: Operation) => void;
  onDelete?: () => void;
}> = ({ operation, operations, onChange, onDelete, query, readonly = false, values }) => {
  const { t } = useTranslation();

  const ready = useMemo(() => operationReady(values, operation), [operation, values]);

  const handleChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      if (onChange) {
        onChange({
          operation_id: e.target.value,
          data: {}
        });
      }
    },
    [onChange]
  );

  return (
    <Card variant="outlined" key={operation.id} sx={[!readonly && ready && { borderColor: 'success.main' }]}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" alignItems="start" spacing={1}>
            <Select
              value={operation.id}
              size="small"
              disabled={readonly || operations.length < 2}
              onChange={handleChange}
            >
              {operations.map(_a => (
                <MenuItem key={_a.id} value={_a.id}>
                  <ListItemText primary={t(_a.i18nKey) ?? _a.title} secondary={_a.description?.short} />
                </MenuItem>
              ))}
            </Select>
            <Divider flexItem orientation="vertical" />
            <Box flex={1} sx={{ '& pre': { whiteSpace: 'normal' } }}>
              <Markdown md={operation.description?.long} />
            </Box>
            {!readonly && (
              <>
                <Divider flexItem orientation="vertical" />

                <IconButton onClick={onDelete}>
                  <Delete />
                </IconButton>
              </>
            )}
          </Stack>
          <Divider orientation="horizontal" />
          {operation.steps
            .filter((_, index, arr) => (index > 0 ? checkArgsAreFilled(arr[index - 1], values) : true))
            .map(step => {
              return (
                <OperationStep
                  readonly={readonly}
                  key={Object.keys(step.args).join('')}
                  step={step}
                  query={query}
                  values={values}
                  setValues={_values =>
                    onChange({
                      operation_id: operation.id,
                      data: _values
                    })
                  }
                />
              );
            })}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default OperationEntry;
