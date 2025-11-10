export interface Aposta {
  id: number;
  categoria: string | null;
  tipo_aposta: string | null;
  casa_de_apostas: string | null;
  valor_apostado: number | null;
  odd: number | null;
  valor_final: number | null;
  bonus: number | null;
  turbo: number | null;
  resultado: string | null;
  detalhes: string | null;
  partida: string | null;
  torneio: string | null;
  data: string | null;
}

export interface Bookie {
  id: number;
  name: string;
  balance: number | null;
  last_deposit: string | null;
  last_withdraw: string | null;
  last_update: string | null;
  created_at: string | null;
}

export interface ApostaFormData {
  categoria: string;
  tipo_aposta: string;
  casa_de_apostas: string;
  valor_apostado: number;
  odd: number;
  bonus: number;
  turbo: number;
  detalhes?: string;
  partida?: string;
  torneio?: string;
  data: string;
}

export interface KPIData {
  totalApostado: number;
  lucro: number;
  roi: number;
  taxaAcerto: number;
  totalApostas: number;
  apostasPendentes: number;
}

export interface SeriesData {
  date: string;
  lucro: number;
  apostas: number;
}

export interface DistributionData {
  name: string;
  value: number;
  percentage: number;
}

export type ResultadoType = 'Ganhou' | 'Perdeu' | 'Cancelado' | 'Cashout' | 'Pendente';
