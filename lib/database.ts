import {getDatabase} from "@netlify/database";

type Row = Record<string, unknown>;
type Result = {rows: Row[]; rowCount: number | null};
type QueryClient = {query(sql: string, values?: unknown[]): Promise<Result>};
export type Connection = QueryClient & {release(): void};
export type Pool = QueryClient & {connect(): Promise<Connection>};

class Statement {
  constructor(readonly pool: Pool, readonly sql: string, readonly values: unknown[] = []) {}
  bind(...values: unknown[]) {return new Statement(this.pool, this.sql, values);}
  async all<T = Row>() {const r = await this.pool.query(this.sql, this.values); return {results: r.rows as T[]};}
  async first<T = Row>() {return (await this.all<T>()).results[0] ?? null;}
  async run() {const r = await this.pool.query(this.sql, this.values); return {meta: {changes: r.rowCount ?? 0}};}
}

// Queries use PostgreSQL $1 parameters; caller values never become SQL text.
export class Database {
  constructor(private readonly pool: Pool) {}
  prepare(sql: string) {return new Statement(this.pool, sql);}
  async batch(statements: Statement[]) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const results = [];
      for (const statement of statements) {
        const r = await client.query(statement.sql, statement.values);
        results.push({results: r.rows, meta: {changes: r.rowCount ?? 0}});
      }
      await client.query("COMMIT");
      return results;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {client.release();}
  }
}

export function database() {return new Database(getDatabase().pool as unknown as Pool);}
