export interface PaperRow {
  id: string;
  id_student: string;
  titulo: string;
  conteudo: string;
  conteudo_tipo: 'markdown' | 'richtext' | 'html';
  tags: string[];
  fonte_paperlab_id: string | null;
  status: 'rascunho' | 'publicado';
  deleted_at: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface PaperShareRow {
  id: string;
  paper_id: string;
  share_token: string;
  visibilidade: 'link' | 'privado';
  expira_em: string | null;
  criado_em: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}
