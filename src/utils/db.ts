import mysql from 'mysql2/promise';
import type { Connection } from 'mysql2/promise';

const DB_CONFIG = {
  host: 'n1nlmysql41plsk.secureserver.net',
  port: 3306,
  user: 'eloiadmin1',
  password: 'Honor@new2025',
  database: 'ph10653097099_rstnedb'
};

export async function getConnection(): Promise<Connection> {
  return await mysql.createConnection(DB_CONFIG);
}

export async function query<T>(sql: string, params?: any[]): Promise<T> {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(sql, params);
    return results as T;
  } finally {
    await connection.end();
  }
}
