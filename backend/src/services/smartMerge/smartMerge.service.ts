import { MergeStrategy } from './mergeStrategy.interface';
import { ReglaValoresIguales } from './rules/iguales.strategy';
import { ReglaDatoVsNull } from './rules/datoVsNull.strategy';
import { ReglaUltimaFecha } from './rules/ultimaFecha.strategy';

export interface MergeExecutionResult {
    datosFusionados: any;
    camposEnConflicto: any;
}

export class SmartMergeService {
    private strategies: MergeStrategy[];

    constructor() {
        // El orden de las estrategias es vital. 
        // Primero verificamos si son iguales, luego si uno es nulo, y por último desempatamos por fecha.
        this.strategies = [
            new ReglaValoresIguales(),
            new ReglaDatoVsNull(),
            new ReglaUltimaFecha()
        ];
    }

    public merge(
        datosA: any, 
        datosB: any, 
        fechaA: Date, 
        fechaB: Date
    ): MergeExecutionResult {
        const result: any = {};
        const camposEnConflicto: any = {};

        // Extraer todas las llaves únicas de ambos objetos
        const allKeys = new Set([...Object.keys(datosA || {}), ...Object.keys(datosB || {})]);

        for (const key of allKeys) {
            const valA = datosA[key];
            const valB = datosB[key];

            let resolved = false;

            for (const strategy of this.strategies) {
                const stepResult = strategy.resolve(key, valA, valB, fechaA, fechaB);
                
                if (stepResult.appliedRule) {
                    result[key] = stepResult.resolvedValue;
                    
                    // Si no fue por igualdad, significa que hubo una resolución activa (conflicto)
                    if (stepResult.appliedRule !== 'ReglaValoresIguales') {
                        camposEnConflicto[key] = {
                            valorA: valA,
                            valorB: valB,
                            reglaAplicada: stepResult.appliedRule,
                            ganador: stepResult.resolvedValue === valA ? 'A' : 'B'
                        };
                    }
                    resolved = true;
                    break;
                }
            }

            // Fallback (teóricamente inalcanzable con UltimaFecha como última regla, 
            // pero buena práctica defensiva)
            if (!resolved) {
                result[key] = valB; // Default a los datos entrantes
                camposEnConflicto[key] = {
                    valorA: valA,
                    valorB: valB,
                    reglaAplicada: 'Fallback (Entrante)',
                    ganador: 'B'
                };
            }
        }

        return {
            datosFusionados: result,
            camposEnConflicto
        };
    }
}
