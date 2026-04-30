import { supabase } from "../../config/supabase";
import { AppError } from "../../shared/errors/AppError";

export class OrgMembersRepository {
  async isActiveUserInOrg(orgId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .schema("app")
      .from("org_members")
      .select("id")
      .eq("org_id", orgId)
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1);

    if (error) {
      throw new AppError("Erro ao validar vínculo do usuário com a organização.", 500, error);
    }

    return Array.isArray(data) && data.length > 0;
  }
}