import { MergeStrategy, MergeResult } from '../mergeStrategy.interface';

export class ReglaValoresIguales implements MergeStrategy {
    resolve(key: string, valueA: any, valueB: any, dateA: Date, dateB: Date): MergeResult {
        // Manejo básico de igualdad de strings, numeros, booleanos
        // Para objetos complejos se requeriría deep equal, pero JSON.stringify suele bastar para este prototipo
        if (valueA === valueB || JSON.stringify(valueA) === JSON.stringify(valueB)) {
            return {
                resolvedValue: valueA,
                appliedRule: 'ReglaValoresIguales'
            };
        }
        
        return { resolvedValue: null, appliedRule: null };
    }
}
