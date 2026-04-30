-- Tabelas de apoio à integração WhatsApp (hipocrites.AI)

-- Histórico de conversas WhatsApp
create table if not exists app.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app.users(id) on delete cascade,
  patient_id uuid references app.patients(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','tool')),
  content text not null,
  media_url text,
  media_type text,
  created_at timestamptz not null default now()
);
create index if not exists idx_chat_messages_user on app.chat_messages (user_id, created_at desc);
create index if not exists idx_chat_messages_patient on app.chat_messages (patient_id, created_at desc);

-- Lembretes agendados (medicação, consulta, follow-up)
create table if not exists app.reminders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references app.patients(id) on delete cascade,
  appointment_id uuid references app.appointments(id) on delete set null,
  title text not null,
  body text,
  scheduled_time timestamptz not null,
  type text not null default 'general'
    check (type in ('general','medication','appointment','follow_up','pre_consultation','checklist')),
  status text not null default 'pending'
    check (status in ('pending','sent','failed','canceled')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_reminders_due on app.reminders (scheduled_time, status) where status = 'pending';
create index if not exists idx_reminders_patient on app.reminders (patient_id, created_at desc);

-- Respostas de checklist pré/pós-consulta
create table if not exists app.checklist_responses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references app.patients(id) on delete cascade,
  consultation_id uuid references app.consultation_sessions(id) on delete cascade,
  appointment_id uuid references app.appointments(id) on delete set null,
  checklist_id text,
  item text not null,
  response text not null,
  alert_level text default 'normal' check (alert_level in ('normal','attention','urgent')),
  created_at timestamptz not null default now()
);
create index if not exists idx_checklist_patient on app.checklist_responses (patient_id, created_at desc);
create index if not exists idx_checklist_consultation on app.checklist_responses (consultation_id);

-- Tarefas / to-dos do paciente
create table if not exists app.tasks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references app.patients(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz,
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  status text default 'pending' check (status in ('pending','in_progress','done','canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_tasks_patient on app.tasks (patient_id, status);

-- Resultados de exames anexados ao paciente
create table if not exists app.lab_results (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references app.patients(id) on delete cascade,
  consultation_id uuid references app.consultation_sessions(id) on delete set null,
  title text not null,
  content text,
  file_url text,
  file_type text,
  date date,
  created_at timestamptz not null default now()
);
create index if not exists idx_lab_results_patient on app.lab_results (patient_id, date desc);

-- Handoff humano: quando o brain solicita atendimento do médico
create table if not exists app.human_handoffs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references app.patients(id) on delete cascade,
  doctor_id uuid references app.doctors(id) on delete set null,
  reason text,
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  status text default 'pending' check (status in ('pending','claimed','resolved','canceled')),
  claimed_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_handoffs_status on app.human_handoffs (status, created_at desc);
create index if not exists idx_handoffs_doctor on app.human_handoffs (doctor_id, status);

-- Pré-consulta coletada via WhatsApp
create table if not exists app.pre_consultations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references app.patients(id) on delete cascade,
  appointment_id uuid references app.appointments(id) on delete cascade,
  chief_complaint text,
  duration text,
  pain_level int check (pain_level is null or (pain_level between 0 and 10)),
  additional_symptoms text,
  status text default 'in_progress' check (status in ('in_progress','completed','skipped')),
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_preconsult_appointment on app.pre_consultations (appointment_id);

-- Follow-up pós-consulta
create table if not exists app.patient_followups (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references app.patients(id) on delete cascade,
  consultation_id uuid not null references app.consultation_sessions(id) on delete cascade,
  feeling text,
  notes text,
  alert_level text default 'normal' check (alert_level in ('normal','attention','urgent')),
  sent_at timestamptz default now(),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_followups_consultation on app.patient_followups (consultation_id);

-- Flags no paciente para consents WhatsApp
alter table app.patients
  add column if not exists whatsapp_opt_in boolean default false,
  add column if not exists whatsapp_opt_in_at timestamptz;

-- Flag no appointment para evitar envio duplo de lembrete
alter table app.appointments
  add column if not exists reminder_24h_sent boolean default false,
  add column if not exists reminder_2h_sent boolean default false,
  add column if not exists confirmation_requested_at timestamptz,
  add column if not exists confirmed_via_whatsapp_at timestamptz;

-- Flag na consulta para evitar envio duplo de follow-up e summary
alter table app.consultation_sessions
  add column if not exists whatsapp_summary_sent_at timestamptz,
  add column if not exists whatsapp_followup_sent_at timestamptz;
