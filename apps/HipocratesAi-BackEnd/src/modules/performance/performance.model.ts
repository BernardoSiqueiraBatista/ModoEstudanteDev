import 'dotenv/config';
import { Pool } from 'pg';

const pool = new Pool({ 
  host: 'localhost',
  port: 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export interface IRawPerformanceData {
  total_resolvidas: string;
  total_acertos: string;
  segundos_estudo: number;
}

export class PerformanceModel {
  public async getRawStatsByStudent(studentId: string): Promise<IRawPerformanceData | null> {

    const studentCheck = await pool.query('SELECT id FROM student WHERE id = $1', [studentId]);
    
    if (studentCheck.rows.length === 0) {
      return null;
    }

    const query = `
      SELECT 
        COUNT(p.id) as total_resolvidas,
        COUNT(p.id) FILTER (WHERE p.correct_answer = true) as total_acertos,
        (SELECT EXTRACT(EPOCH FROM study_time) FROM student WHERE id = $1) as segundos_estudo
      FROM performance p
      WHERE p.id_student = $1;
    `;

    const result = await pool.query(query, [studentId]);
    return result.rows[0];
  }
}