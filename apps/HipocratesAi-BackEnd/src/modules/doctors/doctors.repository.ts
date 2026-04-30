import { supabase } from "../../config/supabase";
import { AppError } from "../../shared/errors/AppError";

export interface DoctorRow {
  id: string;
  full_name: string;
  phone: string | null;
  specialty: string | null;
  crm: string | null;
  created_at: string;
}

export class DoctorsRepository {
  async update(id: string, input: Partial<Omit<DoctorRow, 'id' | 'created_at'>>): Promise<DoctorRow> {
    const filtered = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined)
    );

    const { data, error } = await supabase
      .schema("app")
      .from("doctors")
      .update(filtered)
      .eq("id", id)
      .select(`id, full_name, phone, specialty, crm, created_at`)
      .single();

    if (error) {
      throw new AppError("Erro ao atualizar médico.", 500, error);
    }

    return data as DoctorRow;
  }

  async findById(id: string): Promise<DoctorRow | null> {
    const { data, error } = await supabase
      .schema("app")
      .from("doctors")
      .select(`
        id,
        full_name,
        phone,
        specialty,
        crm,
        created_at
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new AppError("Erro ao buscar médico.", 500, error);
    }

    return data as DoctorRow | null;
  }
}