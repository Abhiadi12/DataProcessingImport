import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { IMPORTS_MESSAGES } from "@/constants";
import type { CsvHeaderHintProps } from "@/types";
import { splitFieldsByRequired } from "@/utils/schema";

export function CsvHeaderHint({ schema }: CsvHeaderHintProps) {
  const fields = schema ? splitFieldsByRequired(schema.fields) : null;

  const title = (
    <div className="flex flex-col gap-1">
      <span>{IMPORTS_MESSAGES.HEADERS_RULE}</span>
      {!fields && <span>{IMPORTS_MESSAGES.HEADERS_PICK_SCHEMA}</span>}
      {fields && fields.required.length > 0 && (
        <span className="font-mono">{IMPORTS_MESSAGES.headersRequired(fields.required)}</span>
      )}
      {fields && fields.optional.length > 0 && (
        <span className="font-mono">{IMPORTS_MESSAGES.headersOptional(fields.optional)}</span>
      )}
    </div>
  );

  return (
    <Tooltip title={title} arrow placement="top">
      <IconButton size="small" className="p-0" aria-label={IMPORTS_MESSAGES.HEADERS_INFO_LABEL}>
        <InfoOutlinedIcon fontSize="inherit" />
      </IconButton>
    </Tooltip>
  );
}
