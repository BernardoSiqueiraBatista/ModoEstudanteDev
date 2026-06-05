import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi';
import type { OpenAPIObject } from 'openapi3-ts/oas30';
import { z } from 'zod';

import {
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  listWeeklyQuerySchema,
  updateAppointmentStatusSchema,
} from '../../modules/appointments/appointments.dto';
import { listPatientsQuerySchema } from '../../modules/patients/dtos/list-patients.query';
import { searchQuerySchema } from '../../modules/search/dtos/search.query';

extendZodWithOpenApi(z);

export function generateOpenApiSpec(): OpenAPIObject {
  const registry = new OpenAPIRegistry();

  const bearerAuth = registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  });

  // Schemas
  registry.register('CreateAppointment', createAppointmentSchema as unknown as z.ZodType);
  registry.register('UpdateAppointmentStatus', updateAppointmentStatusSchema);
  registry.register('ListAppointmentsQuery', listAppointmentsQuerySchema);
  registry.register('ListWeeklyQuery', listWeeklyQuerySchema);
  registry.register('ListPatientsQuery', listPatientsQuerySchema);
  registry.register('SearchQuery', searchQuerySchema);

  // Health
  registry.registerPath({
    method: 'get',
    path: '/health',
    description: 'Health check',
    responses: {
      200: {
        description: 'OK',
        content: { 'application/json': { schema: z.object({ ok: z.boolean() }) } },
      },
    },
  });

  // Patients
  registry.registerPath({
    method: 'get',
    path: '/patients',
    description: 'Lista paginada de pacientes',
    security: [{ [bearerAuth.name]: [] }],
    request: { query: listPatientsQuerySchema },
    responses: { 200: { description: 'Lista de pacientes' } },
  });
  registry.registerPath({
    method: 'get',
    path: '/patients/{id}',
    description: 'Obtém paciente por id',
    security: [{ [bearerAuth.name]: [] }],
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: { 200: { description: 'Paciente' }, 404: { description: 'Não encontrado' } },
  });
  registry.registerPath({
    method: 'post',
    path: '/patients',
    description: 'Cria paciente',
    security: [{ [bearerAuth.name]: [] }],
    responses: { 201: { description: 'Criado' } },
  });
  registry.registerPath({
    method: 'put',
    path: '/patients/{id}',
    description: 'Atualiza paciente',
    security: [{ [bearerAuth.name]: [] }],
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: { 200: { description: 'Atualizado' } },
  });
  registry.registerPath({
    method: 'delete',
    path: '/patients/{id}',
    description: 'Remove paciente',
    security: [{ [bearerAuth.name]: [] }],
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: { 204: { description: 'Removido' } },
  });

  // Appointments
  registry.registerPath({
    method: 'get',
    path: '/appointments',
    description: 'Lista consultas por dia',
    security: [{ [bearerAuth.name]: [] }],
    request: { query: listAppointmentsQuerySchema },
    responses: { 200: { description: 'Lista de consultas' } },
  });
  registry.registerPath({
    method: 'get',
    path: '/appointments/weekly',
    description: 'Lista consultas semanais',
    security: [{ [bearerAuth.name]: [] }],
    request: { query: listWeeklyQuerySchema },
    responses: { 200: { description: 'Lista semanal' } },
  });
  registry.registerPath({
    method: 'get',
    path: '/appointments/{id}',
    description: 'Obtém consulta por id',
    security: [{ [bearerAuth.name]: [] }],
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: { 200: { description: 'Consulta' } },
  });
  registry.registerPath({
    method: 'post',
    path: '/appointments',
    description: 'Cria consulta',
    security: [{ [bearerAuth.name]: [] }],
    request: {
      body: {
        content: {
          'application/json': { schema: createAppointmentSchema as unknown as z.ZodType },
        },
      },
    },
    responses: { 201: { description: 'Criada' } },
  });
  registry.registerPath({
    method: 'patch',
    path: '/appointments/{id}/status',
    description: 'Atualiza status da consulta',
    security: [{ [bearerAuth.name]: [] }],
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: { 'application/json': { schema: updateAppointmentStatusSchema } },
      },
    },
    responses: { 200: { description: 'Atualizada' } },
  });

  // Dashboard
  registry.registerPath({
    method: 'get',
    path: '/dashboard',
    description: 'Métricas do dashboard',
    security: [{ [bearerAuth.name]: [] }],
    responses: { 200: { description: 'Métricas' } },
  });

  // Doctors
  registry.registerPath({
    method: 'get',
    path: '/doctors',
    description: 'Lista médicos',
    security: [{ [bearerAuth.name]: [] }],
    responses: { 200: { description: 'Lista' } },
  });

  // Search
  registry.registerPath({
    method: 'get',
    path: '/search',
    description: 'Busca global (pacientes e consultas)',
    security: [{ [bearerAuth.name]: [] }],
    request: { query: searchQuerySchema },
    responses: { 200: { description: 'Resultados' } },
  });

  // Cases (Task 7)
  registry.registerPath({
    method: 'get',
    path: '/student/v1/cases/{id}/intro',
    description: 'Retorna resumo do caso clínico para a pop-up de início',
    request: { params: z.object({ id: z.string().uuid() }) },
    responses: {
      200: { description: 'Resumo do caso com checklist OSCE e recursos habilitados' },
      404: { description: 'Caso não encontrado' },
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/student/v1/cases/{id}/attempts',
    description: 'Inicia uma tentativa de simulação (modo HM ou OSCE)',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              modo: z.enum(['hm', 'osce']),
              student_id: z.string().uuid(),
            }),
          },
        },
      },
    },
    responses: {
      201: { description: 'Tentativa criada com attempt_id e dados da sessão' },
      404: { description: 'Caso não encontrado' },
      422: { description: 'Dados inválidos' },
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/student/v1/cases/attempts/{aid}/events',
    description: '(OSCE) Registra evento de acerto/erro durante a simulação',
    request: {
      params: z.object({ aid: z.string().uuid() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              tipo: z.enum(['procedimento_correto', 'erro', 'omissao']),
              ref: z.string(),
              pontos: z.number().int(),
              timestamp: z.string().datetime().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: 'Pontuação acumulada e notificação toast' },
      404: { description: 'Tentativa não encontrada' },
      422: { description: 'Modo inválido ou tentativa finalizada' },
    },
  });
  registry.registerPath({
    method: 'post',
    path: '/student/v1/cases/attempts/{aid}/finish',
    description: 'Finaliza a tentativa e retorna pontuação consolidada + feedback LLM',
    request: {
      params: z.object({ aid: z.string().uuid() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              student_id: z.string().uuid(),
            }),
          },
        },
      },
    },
    responses: {
      200: { description: 'Pontuação final, acertos, erros, tempo e feedback' },
      404: { description: 'Tentativa não encontrada' },
      403: { description: 'Sem permissão para finalizar' },
      422: { description: 'Tentativa já finalizada' },
    },
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'HipocratesAi API',
      version: '1.0.0',
      description: 'API do HipocratesAi - prontuário eletrônico e agenda médica.',
    },
    servers: [{ url: 'http://localhost:3333' }],
  });
}
