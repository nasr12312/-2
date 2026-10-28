import type {QuranEvaluation,SchoolPlanEntry} from '../types';
import type {StudentReportDraft} from './student-export.mjs';
export function studentReportRecord(e:QuranEvaluation,options:{date:string;plan?:SchoolPlanEntry;includeNotes?:boolean;enrollment?:string}):StudentReportDraft['records'][number];
