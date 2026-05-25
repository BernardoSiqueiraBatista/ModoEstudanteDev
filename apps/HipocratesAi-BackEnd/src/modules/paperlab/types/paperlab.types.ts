export interface PaperlabSessionRow {
  id: string;
  id_student: string;
  titulo: string;
  criado_em: string;
}

export interface PaperlabSourceRow {
  id: string;
  session_id: string;
  tipo: 'pdf' | 'docx' | 'image' | 'youtube' | 'link';
  url_ou_path: string;
  titulo: string;
  status: 'indexing' | 'ready' | 'error';
  criado_em: string;
}

export interface PaperlabMaterialRow {
  id: string;
  session_id: string;
  tipo: 'flashcards' | 'resumo' | 'simulado' | 'mapa_mental';
  prompt: string;
  conteudo: any; // Armazenado como JSONB
  status: 'pending' | 'ready' | 'error';
  criado_em: string;
}

export interface FlashcardRow {
  id: string;
  material_id: string;
  frente: string;
  verso: string;
  ultimo_review: string | null;
  proximo_review_em: string | null;
  acertos: number;
  erros: number;
}

export interface SourceChunkRow {
  id: string;
  source_id: string;
  session_id: string;
  chunk_text: string;
  embedding: number[] | string;
  ordem: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}
