import psycopg2
import os
import random
from uuid import uuid4
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

def seed_database():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASS") # Ajustado para bater com seu docker-compose[cite: 13]
        )
        cur = conn.cursor()

        print("🚀 Limpando e repovoando com alternativas...")
        cur.execute("TRUNCATE performance, alternative, student, question CASCADE;")

        subjects = ['Anatomia', 'Fisiologia', 'Farmacologia', 'Patologia']
        question_ids = []
        
        # 1. Criar Questões e Alternativas
        for i in range(20):
            q_id = str(uuid4())
            cur.execute(
                "INSERT INTO question (id, question_text, question_level, question_subject) VALUES (%s, %s, %s, %s)",
                (q_id, f"Questão {i} sobre {random.choice(subjects)}", random.randint(1, 3), random.choice(subjects))
            )
            question_ids.append(q_id)

            # Criar 4 alternativas para cada questão[cite: 13]
            correct_index = random.randint(0, 3)
            for idx in range(4):
                is_correct = (idx == correct_index)
                cur.execute(
                    "INSERT INTO alternative (id_question, alternative_text, is_correct, order_index) VALUES (%s, %s, %s, %s)",
                    (q_id, f"Resposta {idx} para a questão {i}", is_correct, idx)
                )

        # 2. Criar Estudantes (Focando nos IDs dos seus testes)[cite: 9]
        marcos_id = "e1925b44-9694-477c-a496-5e638e4a9e25"
        students = [
            (marcos_id, timedelta(hours=10)),
            ("2efb305b-fd11-4cb7-8234-7c0aa5134231", timedelta(seconds=0)), # Aluno sem performance
            (str(uuid4()), timedelta(hours=1))
        ]

        for s_id, s_time in students:
            cur.execute("INSERT INTO student (id, study_time) VALUES (%s, %s)", (s_id, s_time))
            
            # 3. Gerar Performance para o Aluno (exceto o aluno novo)[cite: 15]
            if s_id != "2efb305b-fd11-4cb7-8234-7c0aa5134231":
                # Seleciona 10 questões aleatórias para o aluno responder
                sampled_questions = random.sample(question_ids, 10)
                for q_id in sampled_questions:
                    cur.execute(
                        "INSERT INTO performance (id_student, id_question, correct_answer) VALUES (%s, %s, %s)",
                        (s_id, q_id, random.choice([True, False]))
                    )

        conn.commit()
        print("✅ Banco povoado com sucesso (Questões, Alternativas e Performance)!")

    except Exception as e:
        print(f"❌ Erro: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()

if __name__ == "__main__":
    seed_database()