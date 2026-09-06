import type { JobResult, JobSource, SearchInstructions } from "../domain.js";
export interface JobAcquisitionProvider { search(request: { source: JobSource; instructions: SearchInstructions; limit: number }): Promise<JobResult[]>; }
