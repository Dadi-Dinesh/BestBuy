import type { ReactNode } from 'react';
import { Card } from '../ui/Card';

export function AdminTable({ columns, rows, empty = 'No records found.' }: {
  columns: string[];
  rows: { key: string; cells: ReactNode[] }[];
  empty?: string;
}) {
  return (
    <Card padding="none">
      {rows.length === 0 ? <p className="p-5 text-sm text-slate-500">{empty}</p> : <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>{columns.map(column => <th key={column} scope="col" className="px-4 py-3">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(row => <tr key={row.key}>{row.cells.map((cell, index) =>
              <td key={columns[index]} className="px-4 py-3 align-top text-slate-700">{cell}</td>
            )}</tr>)}
          </tbody>
        </table>
      </div>}
    </Card>
  );
}
