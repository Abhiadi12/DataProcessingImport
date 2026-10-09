import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { Link as RouterLink, useParams } from "react-router";
import { PageLoader } from "@/components/common/PageLoader";
import { StatCard } from "@/components/common/StatCard";
import { ImportActions } from "@/components/import/ImportActions";
import { ImportErrorSample } from "@/components/import/ImportErrorSample";
import { ImportLoadError } from "@/components/import/ImportLoadError";
import { ImportProgressBar } from "@/components/import/ImportProgressBar";
import { ImportStageTracker } from "@/components/import/ImportStageTracker";
import { ImportStatusChip } from "@/components/import/ImportStatusChip";
import { DetailRow } from "@/components/user/DetailRow";
import { IMPORT_DETAIL_MESSAGES, IMPORT_STATUS, projectImportsPath } from "@/constants";
import {
  useGetImport,
  useGetImportProgress,
  useRefreshWhenImportFinishes,
} from "@/service/import.service";
import { formatBytes } from "@/utils/file";
import { formatDateTime, formatNumber } from "@/utils/format";

const timeOrDash = (iso: string | null) =>
  iso ? formatDateTime(iso) : IMPORT_DETAIL_MESSAGES.NOT_YET;

export function ImportDetailPage() {
  const { id = "" } = useParams();
  const detailQuery = useGetImport(id);
  const progressQuery = useGetImportProgress(id);
  const detail = detailQuery.data?.data;
  const live = progressQuery.data?.data;

  useRefreshWhenImportFinishes(live?.status);

  if (detailQuery.isPending) {
    return <PageLoader />;
  }

  if (detailQuery.isError || !detail) {
    return <ImportLoadError error={detailQuery.error} />;
  }

  // Two sources for the same numbers. The progress endpoint is ahead while
  // the import runs (it reads Redis; the details read the database, which the
  // worker updates in batches), so it wins whenever it has answered.
  const status = live?.status ?? detail.status;
  const stage = live ? live.stage : detail.stage;
  const processed = live?.processed ?? detail.processedRows;
  const successful = live?.successful ?? detail.successfulRows;
  const failed = live?.failed ?? detail.failedRows;
  const duplicates = live?.duplicates ?? detail.duplicateRows;
  const totalRows = live?.totalRows ?? detail.totalRows;
  const rowsPerSecond = live?.rowsPerSecond ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          component={RouterLink}
          to={projectImportsPath(detail.projectId)}
          startIcon={<ArrowBackIcon />}
          size="small"
          className="mb-2 -ml-1"
        >
          {IMPORT_DETAIL_MESSAGES.BACK}
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Typography variant="h4" component="h1" className="font-semibold break-all">
              {detail.filename}
            </Typography>
            <ImportStatusChip status={status} />
          </div>
          <ImportActions detail={detail} status={status} />
        </div>
      </div>

      {status === IMPORT_STATUS.FAILED && (
        <Alert severity="error">
          <AlertTitle>{IMPORT_DETAIL_MESSAGES.FAILED_TITLE}</AlertTitle>
          {detail.failureReason ?? IMPORT_DETAIL_MESSAGES.NO_REASON}
        </Alert>
      )}
      {status === IMPORT_STATUS.CANCELLED && (
        <Alert severity="warning">{IMPORT_DETAIL_MESSAGES.CANCELLED}</Alert>
      )}
      {status === IMPORT_STATUS.QUEUED && (
        <Alert severity="info">{IMPORT_DETAIL_MESSAGES.WAITING}</Alert>
      )}
      {status === IMPORT_STATUS.UPLOADING && (
        <Alert severity="warning">{IMPORT_DETAIL_MESSAGES.NOT_STARTED}</Alert>
      )}

      <Card>
        <CardContent className="flex flex-col gap-6 p-6">
          <Typography variant="h6" component="h2">
            {IMPORT_DETAIL_MESSAGES.PROGRESS_TITLE}
          </Typography>
          <ImportProgressBar
            status={status}
            progressPercent={live?.progressPercent ?? detail.progressPercent}
            bytesRead={live?.bytesRead ?? detail.bytesRead}
            sizeBytes={detail.sizeBytes}
          />
          <ImportStageTracker status={status} stage={stage} />
        </CardContent>
      </Card>

      <section aria-label={IMPORT_DETAIL_MESSAGES.COUNTERS_TITLE}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={IMPORT_DETAIL_MESSAGES.PROCESSED} value={formatNumber(processed)} />
          <StatCard
            label={IMPORT_DETAIL_MESSAGES.SUCCESSFUL}
            value={formatNumber(successful)}
            tone="success"
          />
          <StatCard
            label={IMPORT_DETAIL_MESSAGES.FAILED}
            value={formatNumber(failed)}
            tone={failed > 0 ? "error" : "default"}
          />
          <StatCard
            label={IMPORT_DETAIL_MESSAGES.DUPLICATES}
            value={formatNumber(duplicates)}
            tone={duplicates > 0 ? "warning" : "default"}
          />
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Typography variant="h6" component="h2" className="mb-2">
              {IMPORT_DETAIL_MESSAGES.DETAILS_TITLE}
            </Typography>
            <div className="divide-y divide-slate-200">
              <DetailRow label={IMPORT_DETAIL_MESSAGES.SCHEMA}>{detail.schemaName}</DetailRow>
              <DetailRow label={IMPORT_DETAIL_MESSAGES.UPLOADED_BY}>
                {detail.uploadedByName}
              </DetailRow>
              <DetailRow label={IMPORT_DETAIL_MESSAGES.FILE_SIZE}>
                {formatBytes(detail.sizeBytes)}
              </DetailRow>
              <DetailRow label={IMPORT_DETAIL_MESSAGES.TOTAL_ROWS}>
                {totalRows === null
                  ? IMPORT_DETAIL_MESSAGES.TOTAL_ROWS_UNKNOWN
                  : formatNumber(totalRows)}
              </DetailRow>
              <DetailRow label={IMPORT_DETAIL_MESSAGES.SPEED}>
                {rowsPerSecond === null
                  ? IMPORT_DETAIL_MESSAGES.NOT_YET
                  : IMPORT_DETAIL_MESSAGES.rowsPerSecond(formatNumber(Math.round(rowsPerSecond)))}
              </DetailRow>
              {/* The API leaves `attempt` at 0 for an import that has only run
                  once, and records 2, 3, … once retries happen — so 0 is the
                  first attempt. */}
              <DetailRow label={IMPORT_DETAIL_MESSAGES.ATTEMPT}>
                {Math.max(1, detail.attempt)}
              </DetailRow>
              <DetailRow label={IMPORT_DETAIL_MESSAGES.UPLOADED_AT}>
                {formatDateTime(detail.createdAt)}
              </DetailRow>
              <DetailRow label={IMPORT_DETAIL_MESSAGES.QUEUED_AT}>
                {timeOrDash(detail.queuedAt)}
              </DetailRow>
              <DetailRow label={IMPORT_DETAIL_MESSAGES.STARTED_AT}>
                {timeOrDash(detail.startedAt)}
              </DetailRow>
              <DetailRow label={IMPORT_DETAIL_MESSAGES.FINISHED_AT}>
                {timeOrDash(detail.completedAt)}
              </DetailRow>
            </div>
          </CardContent>
        </Card>

        <Card>
          <div className="p-6 pb-2">
            <Typography variant="h6" component="h2">
              {IMPORT_DETAIL_MESSAGES.ERRORS_TITLE}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {IMPORT_DETAIL_MESSAGES.ERRORS_HINT}
            </Typography>
          </div>
          <ImportErrorSample rows={detail.errorSample} />
        </Card>
      </div>
    </div>
  );
}
