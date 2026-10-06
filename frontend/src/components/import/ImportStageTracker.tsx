import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import {
  IMPORT_DETAIL_MESSAGES,
  IMPORT_STAGE_LABELS,
  IMPORT_STAGES,
  IMPORT_STATUS,
} from "@/constants";
import type { ImportStageTrackerProps } from "@/types";

//INFO: The four pipeline stages as a row of steps: done, current, still to come.
// A failed import marks the stage it stopped at in red.
export function ImportStageTracker({ status, stage }: ImportStageTrackerProps) {
  const isCompleted = status === IMPORT_STATUS.COMPLETED;
  // -1 before any stage has started (queued), so no step is highlighted.
  const stageIndex = stage ? IMPORT_STAGES.indexOf(stage) : -1;

  return (
    <Stepper
      alternativeLabel
      // One past the last step = every step shown as done.
      activeStep={isCompleted ? IMPORT_STAGES.length : stageIndex}
      aria-label={IMPORT_DETAIL_MESSAGES.STAGES_LABEL}
    >
      {IMPORT_STAGES.map((step, index) => (
        <Step key={step} completed={isCompleted || index < stageIndex}>
          <StepLabel error={status === IMPORT_STATUS.FAILED && index === stageIndex}>
            {IMPORT_STAGE_LABELS[step]}
          </StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
