import os
import random
import json
from datetime import datetime, timedelta
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

        # ---------------------------------------------------------
        # 0. Criar Tabelas (Garante que o esquema esteja atualizado)
        # ---------------------------------------------------------
        print("🏗️  Limpando esquema e aplicando dbSchema.sql...")
        schema_path = os.path.join(os.path.dirname(__file__), "..", "src", "config", "dbSchema.sql")
        with open(schema_path, "r") as f:
            schema_sql = f.read()
            
        # Força o reset do esquema para evitar erro de "already exists"
        cur.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public;")
        cur.execute(schema_sql)
        conn.commit()

        print("🧹 Limpando dados antigos...")
        
        cur.execute("TRUNCATE study_plan_blocks, study_plans, performance_insights, performance, alternative, student, question CASCADE;")

        # Variáveis padrão para testes em ferramentas como postman e insomnia
        # {
        # "baseUrl": "http://localhost:3333",
        # "studentId": "e1925b44-9694-477c-a496-5e638e4a9e25",
        # "planId": "b1925b44-9694-477c-a496-5e638e4a9e25",
        # "blockId": "c1925b44-9694-477c-a496-5e638e4a9e25"
        # }

        # ---------------------------------------------------------
        # 1. Gerar Estudantes (Sem coluna de nome)
        # ---------------------------------------------------------
        print("👨‍🎓 Criando 10 estudantes sintéticos...")
        student_ids = []
        
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
            questoes_respondidas = random.sample(question_ids, min(len(question_ids), qtd_respondidas))
            
            for q_id in questoes_respondidas:
                acertou = random.random() < 0.65 
                cur.execute(
                    "INSERT INTO performance (id_student, id_question, correct_answer) VALUES (%s, %s, %s)",
                    (s_id, q_id, acertou)
                )

        # ---------------------------------------------------------
        # 4. Gerar Insights Baseados na Nova Tabela JSONB
        # ---------------------------------------------------------
        print("💡 Gerando insights sintéticos...")
        for s_id in student_ids:
            fortes = [
                {"titulo": "Clínica Médica", "descricao_curta": "Bom índice de acertos.", "modulo_referencia": "Clínica Médica", "severidade": None},
                {"titulo": "Constância", "descricao_curta": "Bom tempo médio de estudo.", "modulo_referencia": "Geral", "severidade": None},
                {"titulo": "Cirurgia Básica", "descricao_curta": "Acertos acima da média.", "modulo_referencia": "Cirurgia", "severidade": None}
            ]
            atencao = [
                {"titulo": "Ginecologia e Obstetrícia", "descricao_curta": "Abaixo da média.", "modulo_referencia": "GO", "severidade": "alta"},
                {"titulo": "Pediatria Neonatal", "descricao_curta": "Confusão em marcos de desenvolvimento.", "modulo_referencia": "Pediatria", "severidade": "media"},
                {"titulo": "Ortopedia", "descricao_curta": "Pequena dificuldade com fraturas.", "modulo_referencia": "Ortopedia", "severidade": "baixa"}
            ]
            data_past = datetime.now() - timedelta(days=1)
            
            cur.execute(
                "INSERT INTO performance_insights (id_student, pontos_fortes, pontos_atencao, gerado_em) VALUES (%s, %s, %s, %s)",
                (s_id, json.dumps(fortes), json.dumps(atencao), data_past)
            )

        # ---------------------------------------------------------
        # 5. Gerar Planos de Estudo e Blocos
        # ---------------------------------------------------------
        print("📅 Gerando planos de estudo e blocos...")
        
        # IDs Fixos para facilitar Insomnia
        fixed_plan = "b1925b44-9694-477c-a496-5e638e4a9e25"
        fixed_block = "c1925b44-9694-477c-a496-5e638e4a9e25"
        
        for s_id in student_ids:
            is_fixed = (s_id == fixed_student)
            p_id = fixed_plan if is_fixed else str(uuid4())
            
            cur.execute(
                """INSERT INTO study_plans (id, id_student, titulo, categoria, duracao, areas_foco, parametros, briefing_texto) 
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
                (p_id, s_id, "Plano de Estudos - Residência Médica", "geral", "mensal", 
                 json.dumps(["Cardiologia", "Ginecologia"]), 
                 json.dumps({"horas_por_dia": 4, "dias_semana": ["Segunda", "Terça"]}),
                 "Estudando para prova de residência do ENARE.")
            )

            # Gerar 5 blocos para cada plano
            hoje = datetime.now().date()
            for day_offset in range(5):
                # Se for o plano fixo e o primeiro bloco, usa o fixed_block ID
                b_id = fixed_block if (is_fixed and day_offset == 0) else str(uuid4())
                
                cur.execute(
                    """INSERT INTO study_plan_blocks (id, id_plan, data, hora_inicio, hora_fim, tipo, titulo, especialidade, descricao, status)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                    (b_id, p_id, hoje + timedelta(days=day_offset), "08:00:00", "10:00:00", "teoria", 
                     f"Bloco de estudo {day_offset + 1}", "Cardiologia", "Leitura de capítulos e resumo.", "pendente")
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