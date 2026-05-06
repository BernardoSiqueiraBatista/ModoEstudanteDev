import 'dotenv/config';
import { Pool } from 'pg'; // Supondo que você use o pacote 'pg'

// Configuração do pool (deve estar em um arquivo separado de config)
const pool = new Pool({ 
  host: 'localhost',
  port: 4444, // Porta que definimos no Docker
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export interface IRawPerformanceData {
  total_resolvidas: string;
  total_acertos: string;
  segundos_estudo: number;
}

export class PerformanceModel {
  public async getRawStatsByStudent(studentId: string): Promise<IRawPerformanceData | null> {
    const query = `
      SELECT 
        COUNT(p.id) as total_resolvidas,
        COUNT(p.id) FILTER (WHERE p.correct_answer = true) as total_acertos,
        (SELECT EXTRACT(EPOCH FROM study_time) FROM student WHERE id = $1) as segundos_estudo
      FROM performance p
      WHERE p.id_student = $1;
    `;

    const result = await pool.query(query, [studentId]);
    
    if (result.rows.length === 0) return null;
    
    return result.rows[0];
  }
}