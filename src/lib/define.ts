// Kept separate from ./experiments so meta.ts files don't import the module that globs them.

export interface ExperimentMeta {
  /** Display name shown in the header and on the homepage card. */
  title: string;
  /** One or two sentences about what the experiment is exploring. */
  description: string;
  /** ISO date (YYYY-MM-DD) the experiment was created. Used for sorting. */
  date: string;
  tags?: string[];
  /** Extra milliseconds to wait before the build-time screenshot is taken. */
  screenshotDelay?: number;
}

export const defineExperiment = (meta: ExperimentMeta) => meta;
