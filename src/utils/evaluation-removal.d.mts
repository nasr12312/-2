import type {Database} from '../types';
export function omitDeletedEvaluations(db:Database,ids:Set<string>):Database;
