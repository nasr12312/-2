import {uniqueDailyEvaluations} from './evaluation-slot.mjs';
import {evaluationDate} from './report-period.mjs';
export function reportEvaluations(evaluations,termStartDate){return uniqueDailyEvaluations(evaluations,e=>evaluationDate(e,termStartDate))}
