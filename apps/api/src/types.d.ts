/**
 * Déclarations de types pour la compilation de production.
 *
 * bcrypt est utilisé dans le source mais @types/bcrypt est en devDependency.
 * En production (npm workspace + --omit=dev), TypeScript ne trouve pas les types.
 * Ce fichier fournit les déclarations minimales nécessaires, directement dans le source.
 * En développement local, @types/bcrypt (installé via pnpm) prend la priorité.
 */
declare module 'bcrypt' {
  export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  export function hashSync(data: string | Buffer, saltOrRounds: string | number): string;
  export function compare(data: string | Buffer, encrypted: string): Promise<boolean>;
  export function compareSync(data: string | Buffer, encrypted: string): boolean;
  export function genSalt(rounds?: number, minor?: string): Promise<string>;
  export function genSaltSync(rounds?: number, minor?: string): string;
  export function getRounds(encrypted: string): number;
}
