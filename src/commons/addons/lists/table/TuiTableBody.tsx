import { Collapse } from '@mui/material';
import lodash from 'lodash';
import { useCallback } from 'react';
import { TuiTableCellRenderer, TuiTableColumn, TuiTableRowDetailRenderer } from '.';
import { TuiListElement, TuiListItemOnSelect, TuiListItemProps, TuiListMenuRenderer } from '..';
import TuiListBase from '../TuiListBase';
import TuiListEmpty from '../TuiListEmpty';
import TuiTableLayout from './TuiTableLayout';

type TuiTableBodyProps<T> = {
  keyboard?: boolean;
  layout: TuiTableLayout;
  columns: TuiTableColumn[];
  onRowSelect?: TuiListItemOnSelect<T>;
  menuRenderer?: TuiListMenuRenderer<T>;
  detailRenderer?: TuiTableRowDetailRenderer<T>;
  children?: TuiTableCellRenderer<T>;
};

export default function TuiTableBody<T>({
  keyboard,
  layout,
  columns,
  onRowSelect,
  menuRenderer,
  detailRenderer,
  children
}: TuiTableBodyProps<T>) {
  const trowRenderer = useCallback(
    (props: TuiListItemProps<T>, classRenderer) => {
      return (
        <div className={`tui-table-row ${classRenderer()}`}>
          <div style={{ display: 'flex', position: 'relative' }}>
            {columns.map((column, columnIndex) => {
              const value = lodash.get(props.item.item, column.path || column.column, '');
              return (
                <div
                  key={column.column}
                  className="tui-table-cell"
                  style={{ minWidth: layout.getWidth(column.column) }}
                >
                  {children ? children(value, columnIndex, column, props) : <div>{value as any}</div>}
                </div>
              );
            })}
            {menuRenderer && menuRenderer(props)}
          </div>
          {detailRenderer && (
            <Collapse in={props.item.details} unmountOnExit>
              {detailRenderer(props)}
            </Collapse>
          )}
        </div>
      );
    },
    [layout, columns, menuRenderer, detailRenderer, children]
  );

  return (
    <TuiListBase keyboard={keyboard} onSelect={onRowSelect}>
      {(items, onClick) => {
        return items.length > 0 ? (
          items.map((item, index) => (
            <TuiListElement key={item.id} item={item} position={index} onSelect={onClick}>
              {trowRenderer}
            </TuiListElement>
          ))
        ) : (
          <TuiListEmpty mt={4} />
        );
      }}
    </TuiListBase>
  );
}
