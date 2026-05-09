import os
import random
from uuid import uuid4
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("5432")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
DB_NAME = os.getenv("DB_NAME")

def seed_database():
    conn = None
    try:
        print("🔌 Conectando ao banco de dados...")
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS")
        )
        cur = conn.cursor()

        print("🧹 Limpando dados antigos...")
        cur.execute("TRUNCATE performance, alternative, student, question CASCADE;")

        # ---------------------------------------------------------
        # 1. Gerar Estudantes (Sem coluna de nome)
        # ---------------------------------------------------------
        print("👨‍🎓 Criando 10 estudantes sintéticos...")
        student_ids = []
        
        # ID Fixo para facilitar seus testes no Jest/Postman
        fixed_student = "e1925b44-9694-477c-a496-5e638e4a9e25"
        student_ids.append(fixed_student)
        cur.execute(
            "INSERT INTO student (id, study_time) VALUES (%s, %s * INTERVAL '1 second')",
            (fixed_student, random.randint(0, 360000))
        )

        for _ in range(9):
            s_id = str(uuid4())
            study_seconds = random.randint(0, 360000)
            cur.execute(
                "INSERT INTO student (id, study_time) VALUES (%s, %s * INTERVAL '1 second')",
                (s_id, study_seconds)
            )
            student_ids.append(s_id)

        # ---------------------------------------------------------
        # 2. Gerar Questões e Alternativas
        # ---------------------------------------------------------
        print("📚 Criando 100 questões e 400 alternativas...")
        question_ids = []
        for i in range(100):
            q_id = str(uuid4())
            level = random.randint(1, 3)     # CHECK entre 1 e 3
            subject = random.randint(0, 10)  # CHECK entre 0 e 10
            
            cur.execute(
                "INSERT INTO question (id, question_text, question_level, question_subject) VALUES (%s, %s, %s, %s)",
                (q_id, f"Questão sintética {i+1} focada no assunto {subject} de nível {level}.", level, subject)
            )
            question_ids.append(q_id)

            # Criar 4 alternativas únicas por questão (Respeitando a UNIQUE constraint)
            correct_index = random.randint(0, 3) 
            for order_idx in range(4):
                is_correct = (order_idx == correct_index)
                cur.execute(
                    "INSERT INTO alternative (id_question, alternative_text, is_correct, order_index) VALUES (%s, %s, %s, %s)",
                    (q_id, f"Alternativa índice {order_idx} da questão {i+1}", is_correct, order_idx)
                )

        # ---------------------------------------------------------
        # 3. Gerar Histórico de Performance
        # ---------------------------------------------------------
        print("📊 Gerando histórico de resoluções de simulados...")
        for s_id in student_ids:
            qtd_respondidas = random.randint(15, 60)
            
            # O random.sample garante que as questões não se repitam no sorteio,
            # o que respeita a constraint UNIQUE (id_student, id_question) na tabela performance!
            questoes_respondidas = random.sample(question_ids, min(len(question_ids), qtd_respondidas))
            
            for q_id in questoes_respondidas:
                acertou = random.random() < 0.65 
                cur.execute(
                    "INSERT INTO performance (id_student, id_question, correct_answer) VALUES (%s, %s, %s)",
                    (s_id, q_id, acertou)
                )

        conn.commit()
        print("✅ Seed finalizado com sucesso! Banco está pronto para os testes.")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Erro ao executar seed: {e}")
        
    finally:
        if conn:
            cur.close()
            conn.close()
            print("🔒 Conexão fechada.")

if __name__ == "__main__":
    seed_database()