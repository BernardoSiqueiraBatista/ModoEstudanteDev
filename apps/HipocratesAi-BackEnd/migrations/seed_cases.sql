-- =============================================================================
-- Seed: 5 casos clínicos mockados para Task 7
-- =============================================================================

INSERT INTO cases (titulo, descricao, especialidade, dificuldade, tempo_estimado_min, payload_mock)
VALUES

-- CASO 1: Cardiologia — Média
(
  'Dor torácica em paciente hipertenso',
  'Paciente de 45 anos, sexo masculino, hipertenso e diabético, chega ao pronto-socorro com dor torácica em aperto há 2 horas, irradiando para o braço esquerdo. Refere sudorese intensa e náuseas.',
  'Cardiologia',
  'media',
  20,
  '{
    "paciente": {
      "nome": "Carlos Alberto Mendes",
      "idade": 45,
      "sexo": "M",
      "peso_kg": 82,
      "altura_cm": 175,
      "antecedentes": ["HAS há 10 anos", "DM tipo 2 há 5 anos", "Tabagismo (20 maços/ano)"],
      "medicamentos": ["Losartana 50mg 1x/dia", "Metformina 850mg 2x/dia", "AAS 100mg 1x/dia"],
      "alergias": ["Dipirona"]
    },
    "queixa_principal": "Dor torácica em aperto há 2 horas, irradiando para braço esquerdo",
    "contexto_resumido": "Homem de 45 anos, hipertenso e diabético, apresenta dor torácica típica com irradiação e sintomas associados sugestivos de SCA.",
    "historia_doenca_atual": "Paciente relata que a dor iniciou em repouso, de forte intensidade (8/10), tipo aperto, com irradiação para MSE e mandíbula. Acompanhada de sudorese fria, náuseas e dispneia leve. Nega trauma ou esforço prévio.",
    "checklist_osce": [
      {
        "criterio": "Anamnese",
        "itens": [
          { "ref": "historico_dor_opqrst", "descricao": "Investigou características da dor (OPQRST)", "pontos": 15 },
          { "ref": "antecedentes_familiares", "descricao": "Explorou antecedentes familiares cardiovasculares", "pontos": 10 },
          { "ref": "fatores_risco", "descricao": "Identificou fatores de risco (HAS, DM, tabagismo)", "pontos": 10 },
          { "ref": "medicamentos_uso", "descricao": "Questionou medicações em uso", "pontos": 5 }
        ]
      },
      {
        "criterio": "Exame Físico",
        "itens": [
          { "ref": "afericao_pa", "descricao": "Aferiu pressão arterial", "pontos": 10 },
          { "ref": "auscultacao_cardiaca", "descricao": "Realizou ausculta cardíaca", "pontos": 10 },
          { "ref": "auscultacao_pulmonar", "descricao": "Realizou ausculta pulmonar", "pontos": 5 },
          { "ref": "exame_perfusao", "descricao": "Avaliou perfusão periférica e pulsos", "pontos": 5 }
        ]
      },
      {
        "criterio": "Hipótese Diagnóstica",
        "itens": [
          { "ref": "hipotese_sca", "descricao": "Considerou SCA/IAM como hipótese principal", "pontos": 20 },
          { "ref": "diagnostico_diferencial", "descricao": "Mencionou diagnósticos diferenciais (TEP, dissecção)", "pontos": 10 }
        ]
      },
      {
        "criterio": "Conduta",
        "itens": [
          { "ref": "ecg_10min", "descricao": "Solicitou ECG em < 10 minutos", "pontos": 20 },
          { "ref": "troponina", "descricao": "Solicitou troponina", "pontos": 15 },
          { "ref": "acesso_venoso", "descricao": "Providenciou acesso venoso periférico", "pontos": 5 },
          { "ref": "oxigenoterapia", "descricao": "Avaliou necessidade de O2 suplementar", "pontos": 5 }
        ]
      },
      {
        "criterio": "Comunicação",
        "itens": [
          { "ref": "empatia_paciente", "descricao": "Demonstrou empatia e acolhimento", "pontos": 5 },
          { "ref": "explicacao_conduta", "descricao": "Explicou condutas ao paciente de forma clara", "pontos": 5 }
        ]
      }
    ],
    "recursos_habilitados": {
      "audio_imersivo": true,
      "transcricao_realtime": true,
      "cronometro": true,
      "avaliacao_ia": true
    }
  }'::jsonb
),

-- CASO 2: Neurologia — Fácil
(
  'Cefaleia tensional persistente',
  'Paciente de 32 anos, sexo feminino, professora, apresenta cefaleia bilateral há 3 semanas, tipo pressão, de intensidade moderada. Nega aura, vômitos ou alterações visuais.',
  'Neurologia',
  'facil',
  15,
  '{
    "paciente": {
      "nome": "Maria Eduarda Santos",
      "idade": 32,
      "sexo": "F",
      "peso_kg": 58,
      "altura_cm": 162,
      "antecedentes": ["Ansiedade diagnosticada há 2 anos"],
      "medicamentos": ["Sertralina 50mg 1x/dia"],
      "alergias": []
    },
    "queixa_principal": "Dor de cabeça bilateral há 3 semanas, tipo pressão na nuca",
    "contexto_resumido": "Mulher de 32 anos, professora, com cefaleia tensional persistente associada a estresse laboral e má postura.",
    "historia_doenca_atual": "Paciente relata dor de cabeça bilateral, predominante na região occipital e cervical, tipo pressão/aperto, intensidade 5-6/10. Piora no final do dia e com estresse. Melhora com repouso e analgésicos comuns. Nega febre, rigidez de nuca, perda de peso ou alterações neurológicas focais.",
    "checklist_osce": [
      {
        "criterio": "Anamnese",
        "itens": [
          { "ref": "caracterizacao_cefaleia", "descricao": "Caracterizou a cefaleia (localização, tipo, intensidade, duração)", "pontos": 15 },
          { "ref": "sinais_alarme", "descricao": "Investigou sinais de alarme (febre, rigidez nuca, perda peso)", "pontos": 15 },
          { "ref": "habitos_vida", "descricao": "Investigou hábitos (sono, estresse, postura, tela)", "pontos": 10 },
          { "ref": "uso_analgesicos", "descricao": "Questionou frequência de uso de analgésicos", "pontos": 10 }
        ]
      },
      {
        "criterio": "Exame Físico",
        "itens": [
          { "ref": "exame_neurologico", "descricao": "Realizou exame neurológico básico (pupilas, força, sensibilidade)", "pontos": 15 },
          { "ref": "palpacao_cervical", "descricao": "Palpou musculatura cervical e trapézio", "pontos": 10 },
          { "ref": "fundo_olho", "descricao": "Avaliou fundo de olho ou mencionou necessidade", "pontos": 5 }
        ]
      },
      {
        "criterio": "Hipótese Diagnóstica",
        "itens": [
          { "ref": "hipotese_cefaleia_tensional", "descricao": "Diagnosticou cefaleia tensional episódica/crônica", "pontos": 15 },
          { "ref": "exclusao_secundarias", "descricao": "Excluiu causas secundárias de cefaleia", "pontos": 10 }
        ]
      },
      {
        "criterio": "Conduta",
        "itens": [
          { "ref": "orientacoes_nao_farmacologicas", "descricao": "Orientou medidas não farmacológicas (higiene do sono, atividade física)", "pontos": 10 },
          { "ref": "prescricao_adequada", "descricao": "Fez prescrição adequada (profilaxia se indicada)", "pontos": 10 }
        ]
      },
      {
        "criterio": "Comunicação",
        "itens": [
          { "ref": "empatia_paciente", "descricao": "Demonstrou empatia e acolhimento", "pontos": 5 },
          { "ref": "explicacao_diagnostico", "descricao": "Explicou o diagnóstico de forma compreensível", "pontos": 5 }
        ]
      }
    ],
    "recursos_habilitados": {
      "audio_imersivo": true,
      "transcricao_realtime": true,
      "cronometro": true,
      "avaliacao_ia": true
    }
  }'::jsonb
),

-- CASO 3: Pneumologia — Difícil
(
  'Dispneia aguda em paciente asmático',
  'Paciente de 28 anos, sexo masculino, asmático desde a infância, dá entrada no PS com dispneia intensa, sibilância audível e dificuldade para completar frases. Relata piora progressiva há 6 horas.',
  'Pneumologia',
  'dificil',
  25,
  '{
    "paciente": {
      "nome": "Lucas Pereira da Silva",
      "idade": 28,
      "sexo": "M",
      "peso_kg": 70,
      "altura_cm": 178,
      "antecedentes": ["Asma desde a infância", "Rinite alérgica", "Internação prévia por crise asmática (2024)"],
      "medicamentos": ["Budesonida/Formoterol 200/6mcg 2x/dia", "Salbutamol SOS"],
      "alergias": ["Penicilina"]
    },
    "queixa_principal": "Falta de ar intensa há 6 horas, não melhora com bombinha",
    "contexto_resumido": "Jovem asmático com crise grave que não respondeu ao broncodilatador de resgate. Necessita avaliação de gravidade e manejo de emergência.",
    "historia_doenca_atual": "Paciente refere que acordou com dispneia leve que piorou progressivamente. Usou salbutamol 4 puffs sem melhora significativa. Relata exposição a poeira durante faxina no dia anterior. Nega febre, tosse produtiva ou dor torácica. FR: 32 irpm, FC: 120 bpm, SpO2: 89%.",
    "checklist_osce": [
      {
        "criterio": "Anamnese",
        "itens": [
          { "ref": "historia_asma", "descricao": "Investigou histórico da asma (controle, internações prévias, IOT prévia)", "pontos": 10 },
          { "ref": "fator_desencadeante", "descricao": "Identificou fator desencadeante (exposição a poeira)", "pontos": 10 },
          { "ref": "medicacoes_resgate", "descricao": "Perguntou sobre uso de medicação de resgate e resposta", "pontos": 10 },
          { "ref": "sinais_gravidade", "descricao": "Investigou sinais de crise grave (falar frases, posição, cianose)", "pontos": 10 }
        ]
      },
      {
        "criterio": "Exame Físico",
        "itens": [
          { "ref": "sinais_vitais_completos", "descricao": "Aferiu sinais vitais completos (FR, FC, SpO2, PA)", "pontos": 15 },
          { "ref": "auscultacao_pulmonar", "descricao": "Realizou ausculta pulmonar bilateral", "pontos": 10 },
          { "ref": "uso_musculatura_acessoria", "descricao": "Avaliou uso de musculatura acessória", "pontos": 5 },
          { "ref": "classificacao_gravidade", "descricao": "Classificou gravidade da crise (leve/moderada/grave/muito grave)", "pontos": 15 }
        ]
      },
      {
        "criterio": "Hipótese Diagnóstica",
        "itens": [
          { "ref": "crise_asma_grave", "descricao": "Diagnosticou crise asmática grave", "pontos": 15 },
          { "ref": "exclusao_pneumotorax", "descricao": "Considerou pneumotórax como diferencial", "pontos": 5 }
        ]
      },
      {
        "criterio": "Conduta",
        "itens": [
          { "ref": "oxigenoterapia_imediata", "descricao": "Iniciou oxigenoterapia para manter SpO2 > 93%", "pontos": 15 },
          { "ref": "broncodilatador_nebulizacao", "descricao": "Prescreveu broncodilatador por nebulização contínua", "pontos": 15 },
          { "ref": "corticoide_sistemico", "descricao": "Prescreveu corticoide sistêmico (prednisolona/hidrocortisona)", "pontos": 15 },
          { "ref": "reavaliacao_30min", "descricao": "Planejou reavaliação em 30-60 minutos", "pontos": 10 }
        ]
      },
      {
        "criterio": "Comunicação",
        "itens": [
          { "ref": "tranquilizar_paciente", "descricao": "Tranquilizou o paciente durante a crise", "pontos": 5 },
          { "ref": "explicacao_plano", "descricao": "Explicou o plano terapêutico", "pontos": 5 }
        ]
      }
    ],
    "recursos_habilitados": {
      "audio_imersivo": true,
      "transcricao_realtime": true,
      "cronometro": true,
      "avaliacao_ia": true
    }
  }'::jsonb
),

-- CASO 4: Pediatria — Média
(
  'Dor abdominal aguda em criança de 8 anos',
  'Criança de 8 anos, sexo masculino, trazida pela mãe ao PS com dor abdominal intensa há 12 horas, inicialmente periumbilical e agora localizada em FID. Apresentou um episódio de vômito e febre baixa.',
  'Pediatria',
  'media',
  20,
  '{
    "paciente": {
      "nome": "Pedro Henrique Oliveira",
      "idade": 8,
      "sexo": "M",
      "peso_kg": 28,
      "altura_cm": 130,
      "antecedentes": ["Vacinação em dia", "DNPM adequado"],
      "medicamentos": [],
      "alergias": []
    },
    "queixa_principal": "Dor na barriga forte há 12 horas, agora mais do lado direito",
    "contexto_resumido": "Criança de 8 anos com quadro clínico sugestivo de apendicite aguda — dor migratória, febre e vômito.",
    "historia_doenca_atual": "Mãe relata que a criança começou com dor periumbilical ontem à noite, evoluindo para dor em FID. Apresentou 1 episódio de vômito e recusou alimentação. Febre de 37.8°C aferida em casa. Última evacuação há 2 dias. Nega diarreia ou disúria.",
    "checklist_osce": [
      {
        "criterio": "Anamnese",
        "itens": [
          { "ref": "evolucao_dor", "descricao": "Investigou evolução temporal e migração da dor", "pontos": 15 },
          { "ref": "sintomas_associados", "descricao": "Perguntou sobre vômitos, febre, hábito intestinal", "pontos": 10 },
          { "ref": "alimentacao_recente", "descricao": "Investigou última refeição e aceitação alimentar", "pontos": 5 },
          { "ref": "antecedentes_cirurgicos", "descricao": "Questionou cirurgias abdominais prévias", "pontos": 5 }
        ]
      },
      {
        "criterio": "Exame Físico",
        "itens": [
          { "ref": "palpacao_abdominal", "descricao": "Realizou palpação abdominal sistemática", "pontos": 15 },
          { "ref": "sinal_blumberg", "descricao": "Pesquisou sinal de Blumberg (descompressão dolorosa)", "pontos": 15 },
          { "ref": "sinal_rovsing", "descricao": "Pesquisou sinal de Rovsing", "pontos": 10 },
          { "ref": "temperatura", "descricao": "Aferiu temperatura", "pontos": 5 }
        ]
      },
      {
        "criterio": "Hipótese Diagnóstica",
        "itens": [
          { "ref": "hipotese_apendicite", "descricao": "Considerou apendicite aguda como principal hipótese", "pontos": 20 },
          { "ref": "diferenciais_pediatricos", "descricao": "Mencionou diferenciais (adenite mesentérica, ITU, constipação)", "pontos": 10 }
        ]
      },
      {
        "criterio": "Conduta",
        "itens": [
          { "ref": "hemograma_pcrr", "descricao": "Solicitou hemograma e PCR", "pontos": 10 },
          { "ref": "usg_abdominal", "descricao": "Solicitou USG abdominal", "pontos": 15 },
          { "ref": "jejum_hidratacao", "descricao": "Manteve paciente em jejum e iniciou hidratação EV", "pontos": 10 },
          { "ref": "encaminhamento_cirurgia", "descricao": "Solicitou avaliação cirúrgica", "pontos": 10 }
        ]
      },
      {
        "criterio": "Comunicação",
        "itens": [
          { "ref": "comunicacao_crianca", "descricao": "Comunicou-se de forma adequada com a criança", "pontos": 5 },
          { "ref": "orientacao_responsavel", "descricao": "Orientou a mãe sobre o quadro e próximos passos", "pontos": 5 }
        ]
      }
    ],
    "recursos_habilitados": {
      "audio_imersivo": true,
      "transcricao_realtime": true,
      "cronometro": true,
      "avaliacao_ia": true
    }
  }'::jsonb
),

-- CASO 5: Obstetrícia — Difícil
(
  'Gestante com sangramento vaginal no 3º trimestre',
  'Gestante de 34 anos, G2P1, 35 semanas, apresenta sangramento vaginal vermelho-vivo, indolor, de início súbito há 1 hora. Nega contrações, perda de líquido ou trauma.',
  'Obstetrícia',
  'dificil',
  25,
  '{
    "paciente": {
      "nome": "Ana Beatriz Ferreira",
      "idade": 34,
      "sexo": "F",
      "peso_kg": 72,
      "altura_cm": 165,
      "antecedentes": ["G2P1 (parto cesáreo prévio em 2023)", "Placenta prévia diagnosticada na USG de 28 semanas"],
      "medicamentos": ["Sulfato ferroso 40mg 1x/dia", "Ácido fólico 5mg 1x/dia"],
      "alergias": [],
      "dados_obstetricos": {
        "ig": "35 semanas e 2 dias",
        "tipo_sanguineo": "O+",
        "pre_natal": "8 consultas realizadas",
        "ultrassonografia": "USG 28s: placenta prévia centro-total"
      }
    },
    "queixa_principal": "Sangramento vaginal vermelho-vivo, sem dor, há 1 hora",
    "contexto_resumido": "Gestante de 35 semanas com sangramento indolor e antecedente de placenta prévia — quadro sugestivo de sangramento por placenta prévia.",
    "historia_doenca_atual": "Paciente relata que estava em repouso quando notou sangramento vaginal vivo, em moderada quantidade, sem dor abdominal ou contrações. Movimentação fetal preservada. Nega trauma, relação sexual recente ou perda de líquido. PA em casa: 120x80 mmHg.",
    "checklist_osce": [
      {
        "criterio": "Anamnese",
        "itens": [
          { "ref": "caracterizacao_sangramento", "descricao": "Caracterizou sangramento (quantidade, cor, dor associada)", "pontos": 15 },
          { "ref": "historia_obstetrica", "descricao": "Revisou história obstétrica (IG, pré-natal, USGs prévias)", "pontos": 10 },
          { "ref": "movimentacao_fetal", "descricao": "Perguntou sobre movimentação fetal", "pontos": 10 },
          { "ref": "antecedente_placenta_previa", "descricao": "Correlacionou com diagnóstico prévio de placenta prévia", "pontos": 10 }
        ]
      },
      {
        "criterio": "Exame Físico",
        "itens": [
          { "ref": "sinais_vitais_maternos", "descricao": "Aferiu sinais vitais maternos (PA, FC, temperatura)", "pontos": 10 },
          { "ref": "exame_especular", "descricao": "Realizou exame especular (NÃO toque vaginal)", "pontos": 15 },
          { "ref": "nao_toque_vaginal", "descricao": "Evitou toque vaginal em suspeita de placenta prévia", "pontos": 20 },
          { "ref": "bcf", "descricao": "Auscultou BCF / solicitou cardiotocografia", "pontos": 15 }
        ]
      },
      {
        "criterio": "Hipótese Diagnóstica",
        "itens": [
          { "ref": "hipotese_pp", "descricao": "Diagnosticou sangramento por placenta prévia", "pontos": 15 },
          { "ref": "diferencial_dpp", "descricao": "Diferenciou de DPP (descolamento prematuro de placenta)", "pontos": 10 }
        ]
      },
      {
        "criterio": "Conduta",
        "itens": [
          { "ref": "internacao_imediata", "descricao": "Indicou internação e repouso absoluto", "pontos": 10 },
          { "ref": "reserva_sangue", "descricao": "Solicitou reserva de sangue/tipagem sanguínea", "pontos": 10 },
          { "ref": "usg_doppler", "descricao": "Solicitou USG obstétrica com Doppler", "pontos": 10 },
          { "ref": "corticoide_maturacao", "descricao": "Indicou corticoide para maturação pulmonar fetal", "pontos": 15 },
          { "ref": "planejamento_parto", "descricao": "Discutiu planejamento do parto (via de parto)", "pontos": 10 }
        ]
      },
      {
        "criterio": "Comunicação",
        "itens": [
          { "ref": "acolhimento_gestante", "descricao": "Acolheu a gestante com empatia", "pontos": 5 },
          { "ref": "orientacao_familiar", "descricao": "Orientou paciente e acompanhante sobre o quadro", "pontos": 5 }
        ]
      }
    ],
    "recursos_habilitados": {
      "audio_imersivo": true,
      "transcricao_realtime": true,
      "cronometro": true,
      "avaliacao_ia": true
    }
  }'::jsonb
)

ON CONFLICT DO NOTHING;
