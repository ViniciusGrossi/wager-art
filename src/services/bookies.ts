import { supabase } from "@/integrations/supabase/client";
import type { Bookie } from "@/types/betting";

export const bookiesService = {
  async list() {
    const { data, error } = await supabase
      .from("bookies")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data as Bookie[];
  },

  async getByName(name: string) {
    const { data, error } = await supabase
      .from("bookies")
      .select("*")
      .eq("name", name)
      .single();

    if (error) throw error;
    return data as Bookie;
  },

  async updateBalance(id: number, newBalance: number) {
    const { error } = await supabase
      .from("bookies")
      .update({ 
        balance: newBalance,
        last_update: new Date().toISOString()
      })
      .eq("id", id);

    if (error) throw error;
  },

  async create(name: string, initialBalance: number = 0) {
    const { data, error } = await supabase
      .from("bookies")
      .insert({ name, balance: initialBalance })
      .select()
      .single();

    if (error) throw error;
    return data as Bookie;
  },
};
