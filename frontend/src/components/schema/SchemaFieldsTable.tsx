import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { FIELD_TYPE_LABELS, SCHEMAS_MESSAGES } from "@/constants";
import type { SchemaFieldsTableProps } from "@/types";

const yesNo = (value: boolean) => (value ? SCHEMAS_MESSAGES.YES : SCHEMAS_MESSAGES.NO);

export function SchemaFieldsTable({ fields }: SchemaFieldsTableProps) {
  return (
    <TableContainer className="rounded-lg border border-slate-200">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{SCHEMAS_MESSAGES.FIELD_NAME}</TableCell>
            <TableCell>{SCHEMAS_MESSAGES.FIELD_TYPE}</TableCell>
            <TableCell>{SCHEMAS_MESSAGES.FIELD_REQUIRED}</TableCell>
            <TableCell>{SCHEMAS_MESSAGES.FIELD_UNIQUE}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Object.entries(fields).map(([name, field]) => (
            <TableRow key={name}>
              <TableCell className="font-mono text-sm">{name}</TableCell>
              <TableCell>{FIELD_TYPE_LABELS[field.type]}</TableCell>
              <TableCell>{yesNo(field.required)}</TableCell>
              <TableCell>{yesNo(field.unique)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
