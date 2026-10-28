import type {QuranEvaluation,SchoolPlanEntry,Classroom} from '../types';
import type {StudentReportDraft} from './student-export.mjs';
export function studentReportRecord(e:QuranEvaluation,options:{date:string;plan?:SchoolPlanEntry;includeNotes?:boolean;enrollment?:string}):StudentReportDraft['records'][number];

export function studentReportPlan(e:QuranEvaluation,plans?:SchoolPlanEntry[],classroom?:Classroom):SchoolPlanEntry|undefined;
