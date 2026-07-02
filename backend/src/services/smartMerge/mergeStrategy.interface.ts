export interface MergeResult {
    resolvedValue: any;
    appliedRule: string | null;
}

export interface MergeStrategy {
    /**
     * Intenta resolver el conflicto para una llave específica.
     * Si la estrategia no puede resolverlo, debe retornar null en appliedRule.
     */
    resolve(key: string, valueA: any, valueB: any, dateA: Date, dateB: Date): MergeResult;
}
