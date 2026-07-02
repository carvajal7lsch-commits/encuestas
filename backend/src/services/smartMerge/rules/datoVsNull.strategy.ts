import { MergeStrategy, MergeResult } from '../mergeStrategy.interface';

export class ReglaDatoVsNull implements MergeStrategy {
    resolve(key: string, valueA: any, valueB: any, dateA: Date, dateB: Date): MergeResult {
        const isNullA = valueA === null || valueA === undefined || valueA === '';
        const isNullB = valueB === null || valueB === undefined || valueB === '';

        if (!isNullA && isNullB) {
            return {
                resolvedValue: valueA,
                appliedRule: 'ReglaDatoVsNull'
            };
        }

        if (isNullA && !isNullB) {
            return {
                resolvedValue: valueB,
                appliedRule: 'ReglaDatoVsNull'
            };
        }

        return { resolvedValue: null, appliedRule: null };
    }
}
