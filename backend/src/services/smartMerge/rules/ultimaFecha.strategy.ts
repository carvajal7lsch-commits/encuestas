import { MergeStrategy, MergeResult } from '../mergeStrategy.interface';

export class ReglaUltimaFecha implements MergeStrategy {
    resolve(key: string, valueA: any, valueB: any, dateA: Date, dateB: Date): MergeResult {
        // Asume que si llega a esta regla, ambos tienen datos pero son diferentes.
        // Gana el que tenga la fecha más reciente.
        if (dateA > dateB) {
            return {
                resolvedValue: valueA,
                appliedRule: 'ReglaUltimaFecha'
            };
        } else {
            return {
                resolvedValue: valueB,
                appliedRule: 'ReglaUltimaFecha'
            };
        }
    }
}
