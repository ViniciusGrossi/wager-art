import { useState, useEffect, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { apostasService } from "@/services/apostas";
import { useFilterStore } from "@/store/useFilterStore";
import { KPICard } from "@/components/dashboard/KPICard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, 
  Line, LineChart, ComposedChart, Legend, Radar, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Area, AreaChart, ReferenceLine, PieChart, Pie, Cell
} from "recharts";
import { ScatterChart, Scatter } from "recharts";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import type { Aposta, SeriesData } from "@/types/betting";
import dayjs from "dayjs";
import { 
  AlertCircle, TrendingUp, TrendingDown, Target, Activity, Zap, Trophy, 
  BarChart3, Flame, Calendar, Shield, ArrowUp, ArrowDown, Gauge, Clock, Medal
} from "lucide-react";

// Tipos de dados personalizados
interface PerformanceMetrics {
  casa: string;
  roi: number;
  lucro: number;
  taxaAcerto: number;
  apostas: number;
  volatility?: number;
}

interface OddAnalysis {
  range: string;
  won: number;
  lost: number;
  roi: number;
  probability: number;
}

interface MonthlyPerformance {
  month: string;
  roi: number;
  volume: number;
  apostas: number;
  variacao: number;
  lucro: number;
}

interface TimePatterns {
  day: string;
  period: string;
  lucro: number;
  apostas: number;
}

interface RiskMetrics {
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  profitFactor: number;
}

const CHART_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Analises() {
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dados processados
  const [performanceByHouse, setPerformanceByHouse] = useState<PerformanceMetrics[]>([]);
  const [byCategoria, setByCategoria] = useState<{ name: string; lucro: number; apostas: number; roi: number }[]>([]);
  const [oddAnalysis, setOddAnalysis] = useState<OddAnalysis[]>([]);
  const [oddSeries, setOddSeries] = useState<{ date: string; odd: number }[]>([]);
  const [timePatterns, setTimePatterns] = useState<TimePatterns[]>([]);
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    maxDrawdown: 0,
    sharpeRatio: 0,
    volatility: 0,
    profitFactor: 0,
  });

  const { startDate, endDate, casa, tipo } = useFilterStore();
  const [activeTab, setActiveTab] = useState<string>("visao-geral");

  // Helper functions
  const sum = (arr: number[]) => arr.reduce((s, v) => s + (v || 0), 0);
  const mean = (arr: number[]) => (arr.length ? sum(arr) / arr.length : 0);

  // KPIs dinâmicos por aba
  const kpisForActiveTab = useMemo(() => {
    const totalApostado = apostas.reduce((s, a) => s + (a.valor_apostado || 0), 0);
    const resolvidas = apostas.filter((a) => a.resultado && ["Ganhou", "Perdeu", "Cancelado", "Cashout"].includes(a.resultado));
    const lucro = resolvidas.reduce((s, a) => s + (a.valor_final || 0), 0);
    const roi = totalApostado > 0 ? (lucro / totalApostado) * 100 : 0;
    const taxaAcerto = resolvidas.length ? (resolvidas.filter((r) => r.resultado === "Ganhou").length / resolvidas.length) * 100 : 0;

    if (activeTab === "visao-geral") {
      return [
        { title: "Total Apostado", value: formatCurrency(totalApostado), icon: Activity },
        { title: "Lucro Líquido", value: formatCurrency(lucro), icon: TrendingUp },
        { title: "ROI", value: formatPercentage(roi), icon: Target },
        { title: "Taxa de Acerto", value: formatPercentage(taxaAcerto), icon: Trophy },
      ];
    }

    if (activeTab === "casas") {
      const topCasa = performanceByHouse[0];
      return [
        { title: "Top Casa (ROI)", value: topCasa ? formatPercentage(topCasa.roi) : "-", icon: Trophy },
        { title: "Casas Analisadas", value: performanceByHouse.length, icon: BarChart3 },
        { title: "Melhor Lucro", value: topCasa ? formatCurrency(topCasa.lucro) : "-", icon: TrendingUp },
        { title: "Volume (apostas)", value: sum(performanceByHouse.map(h => h.apostas)), icon: Activity },
      ];
    }

    if (activeTab === "categorias") {
      const topCat = byCategoria[0];
      return [
        { title: "Top Categoria", value: topCat?.name || "-", icon: Flame },
        { title: "Categorias (≥10)", value: byCategoria.length, icon: BarChart3 },
        { title: "Lucro Total", value: formatCurrency(sum(byCategoria.map(c => c.lucro))), icon: TrendingUp },
        { title: "Volume (apostas)", value: sum(byCategoria.map(c => c.apostas)), icon: Activity },
      ];
    }

    if (activeTab === "odds") {
      const avgOdd = mean(oddSeries.map(o => o.odd));
      const bestRange = [...oddAnalysis].sort((a,b) => b.roi - a.roi)[0];
      return [
        { title: "Odd Média", value: avgOdd ? avgOdd.toFixed(2) : "-", icon: BarChart3 },
        { title: "Melhor Faixa", value: bestRange?.range || "-", icon: Target },
        { title: "ROI (melhor faixa)", value: bestRange ? formatPercentage(bestRange.roi) : "-", icon: Trophy },
        { title: "Faixas Analisadas", value: oddAnalysis.length, icon: Activity },
      ];
    }

    if (activeTab === "padroes") {
      const dayStats = timePatterns.reduce((acc, t) => {
        if (!acc[t.day]) acc[t.day] = { lucro: 0, apostas: 0 };
        acc[t.day].lucro += t.lucro;
        acc[t.day].apostas += t.apostas;
        return acc;
      }, {} as Record<string, { lucro: number; apostas: number }>);
      
      const bestDay = Object.entries(dayStats).sort((a, b) => b[1].lucro - a[1].lucro)[0];
      
      return [
        { title: "Melhor Dia", value: bestDay?.[0] || "-", icon: Calendar },
        { title: "Lucro (melhor dia)", value: bestDay ? formatCurrency(bestDay[1].lucro) : "-", icon: TrendingUp },
        { title: "Padrões Identificados", value: timePatterns.length, icon: Clock },
        { title: "Volume Total", value: sum(timePatterns.map(t => t.apostas)), icon: Activity },
      ];
    }

    if (activeTab === "temporal") {
      const melhorMes = [...monthlyPerformance].sort((a, b) => b.lucro - a.lucro)[0];
      return [
        { title: "Melhor Mês", value: melhorMes?.month || "-", icon: Trophy },
        { title: "Lucro (melhor mês)", value: melhorMes ? formatCurrency(melhorMes.lucro) : "-", icon: TrendingUp },
        { title: "Meses Analisados", value: monthlyPerformance.length, icon: Calendar },
        { title: "Média Mensal", value: formatCurrency(mean(monthlyPerformance.map(m => m.lucro))), icon: BarChart3 },
      ];
    }

    if (activeTab === "risco") {
      return [
        { title: "Sharpe Ratio", value: riskMetrics.sharpeRatio.toFixed(2), icon: Gauge },
        { title: "Max Drawdown", value: formatCurrency(riskMetrics.maxDrawdown), icon: Shield },
        { title: "Volatilidade", value: formatCurrency(riskMetrics.volatility), icon: TrendingDown },
        { title: "Profit Factor", value: riskMetrics.profitFactor.toFixed(2), icon: Target },
      ];
    }

    return [
      { title: "Total Apostado", value: formatCurrency(totalApostado), icon: Activity },
      { title: "Lucro Líquido", value: formatCurrency(lucro), icon: TrendingUp },
      { title: "ROI", value: formatPercentage(roi), icon: Target },
      { title: "Taxa de Acerto", value: formatPercentage(taxaAcerto), icon: Trophy },
    ];
  }, [activeTab, apostas, performanceByHouse, byCategoria, oddSeries, oddAnalysis, timePatterns, monthlyPerformance, riskMetrics]);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, casa, tipo]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await apostasService.list({ startDate, endDate, casa, tipo });
      setApostas(result.data);

      const seriesData = await apostasService.series({ startDate, endDate, casa, tipo });
      setSeries(seriesData);

      processarDados(result.data, seriesData);
    } catch (error) {
      console.error("Erro ao carregar análises:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processarDados = (dados: Aposta[], seriesData: SeriesData[]) => {
    // ===== PERFORMANCE POR CASA =====
    const casaStats: Record<string, { lucro: number; apostas: number; valor_apostado: number; ganhas: number }> = {};
    dados.forEach((a) => {
      if (!a.casa_de_apostas) return;
      if (!casaStats[a.casa_de_apostas]) {
        casaStats[a.casa_de_apostas] = { lucro: 0, apostas: 0, valor_apostado: 0, ganhas: 0 };
      }
      casaStats[a.casa_de_apostas].lucro += a.valor_final || 0;
      casaStats[a.casa_de_apostas].apostas += 1;
      casaStats[a.casa_de_apostas].valor_apostado += a.valor_apostado || 0;
      if (a.resultado === "Ganhou") casaStats[a.casa_de_apostas].ganhas += 1;
    });

    const performance: PerformanceMetrics[] = Object.entries(casaStats).map(([casa, stats]) => ({
      casa,
      roi: stats.valor_apostado > 0 ? (stats.lucro / stats.valor_apostado) * 100 : 0,
      lucro: stats.lucro,
      taxaAcerto: stats.apostas > 0 ? (stats.ganhas / stats.apostas) * 100 : 0,
      apostas: stats.apostas,
    }));
    setPerformanceByHouse(performance.sort((a, b) => b.roi - a.roi));

    // ===== CATEGORIAS =====
    const categoriaStats: Record<string, { lucro: number; apostas: number; valor_apostado: number }> = {};
    dados.forEach((a) => {
      if (!a.categoria) return;
      if (!categoriaStats[a.categoria]) categoriaStats[a.categoria] = { lucro: 0, apostas: 0, valor_apostado: 0 };
      categoriaStats[a.categoria].lucro += a.valor_final || 0;
      categoriaStats[a.categoria].apostas += 1;
      categoriaStats[a.categoria].valor_apostado += a.valor_apostado || 0;
    });

    const categoriasFormatted = Object.entries(categoriaStats)
      .map(([name, stats]) => ({
        name,
        lucro: stats.lucro,
        apostas: stats.apostas,
        roi: stats.valor_apostado > 0 ? (stats.lucro / stats.valor_apostado) * 100 : 0,
      }))
      .filter(c => c.apostas >= 10)
      .sort((a, b) => b.lucro - a.lucro);
    setByCategoria(categoriasFormatted);

    // ===== ANÁLISE DE ODDS =====
    const oddRanges: Record<string, { won: number; lost: number; roi_sum: number; prob_sum: number; count: number }> = {
      "1.0-1.5": { won: 0, lost: 0, roi_sum: 0, prob_sum: 0, count: 0 },
      "1.5-2.0": { won: 0, lost: 0, roi_sum: 0, prob_sum: 0, count: 0 },
      "2.0-3.0": { won: 0, lost: 0, roi_sum: 0, prob_sum: 0, count: 0 },
      "3.0-5.0": { won: 0, lost: 0, roi_sum: 0, prob_sum: 0, count: 0 },
      "5.0+": { won: 0, lost: 0, roi_sum: 0, prob_sum: 0, count: 0 },
    };

    dados.forEach((a) => {
      const odd = a.odd || 0;
      const resolvida = ["Ganhou", "Perdeu"].includes(a.resultado || "");
      let range = "5.0+";
      
      if (odd >= 1.0 && odd < 1.5) range = "1.0-1.5";
      else if (odd >= 1.5 && odd < 2.0) range = "1.5-2.0";
      else if (odd >= 2.0 && odd < 3.0) range = "2.0-3.0";
      else if (odd >= 3.0 && odd < 5.0) range = "3.0-5.0";

      if (resolvida) {
        if (a.resultado === "Ganhou") oddRanges[range].won += 1;
        else oddRanges[range].lost += 1;
        
        const roi = (a.valor_final || 0) / (a.valor_apostado || 1);
        oddRanges[range].roi_sum += roi;
        oddRanges[range].prob_sum += 1 / odd;
        oddRanges[range].count += 1;
      }
    });

    const oddAnalysisFormatted = Object.entries(oddRanges)
      .map(([range, stats]) => ({
        range,
        won: stats.won,
        lost: stats.lost,
        roi: stats.count > 0 ? (stats.roi_sum / stats.count) * 100 : 0,
        probability: stats.count > 0 ? (stats.prob_sum / stats.count) * 100 : 0,
      }));
    setOddAnalysis(oddAnalysisFormatted);

    // ===== MÉDIA DE ODDS =====
    const oddsByDate: Record<string, { total: number; count: number }> = {};
    dados.forEach((a) => {
      if (!a.data || !a.odd) return;
      const date = dayjs(a.data).format("YYYY-MM-DD");
      if (!oddsByDate[date]) oddsByDate[date] = { total: 0, count: 0 };
      oddsByDate[date].total += a.odd;
      oddsByDate[date].count += 1;
    });
    const oddSeriesFormatted = Object.entries(oddsByDate)
      .map(([date, stats]) => ({
        date: dayjs(date).format("DD/MM"),
        odd: stats.total / stats.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    setOddSeries(oddSeriesFormatted);

    // ===== PERFORMANCE MENSAL =====
    const monthlyStats: Record<string, { lucro: number; apostas: number; valor_apostado: number }> = {};
    dados.forEach((a) => {
      if (!a.data) return;
      const month = dayjs(a.data).format("YYYY-MM");
      if (!monthlyStats[month]) monthlyStats[month] = { lucro: 0, apostas: 0, valor_apostado: 0 };
      monthlyStats[month].lucro += a.valor_final || 0;
      monthlyStats[month].apostas += 1;
      monthlyStats[month].valor_apostado += a.valor_apostado || 0;
    });

    const months = Object.keys(monthlyStats).sort();
    const monthlyFormatted = months.map((month, idx) => {
      const stats = monthlyStats[month];
      const prevMonth = idx > 0 ? monthlyStats[months[idx - 1]] : null;
      const roi = stats.valor_apostado > 0 ? (stats.lucro / stats.valor_apostado) * 100 : 0;
      const prevRoi = prevMonth && prevMonth.valor_apostado > 0 ? (prevMonth.lucro / prevMonth.valor_apostado) * 100 : 0;
      const variacao = prevRoi !== 0 ? ((roi - prevRoi) / Math.abs(prevRoi)) * 100 : 0;

      return {
        month: dayjs(month).format("MMM/YY"),
        roi,
        volume: stats.apostas,
        apostas: stats.apostas,
        variacao,
        lucro: stats.lucro,
      };
    });
    setMonthlyPerformance(monthlyFormatted);

    // ===== PADRÕES TEMPORAIS =====
    const timePatternMap: Record<string, { lucro: number; apostas: number }> = {};
    const daysOfWeek = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];
    const periods = ["Madrugada", "Manhã", "Tarde", "Noite"];

    daysOfWeek.forEach((day) => {
      periods.forEach((period) => {
        timePatternMap[`${day}-${period}`] = { lucro: 0, apostas: 0 };
      });
    });

    dados.forEach((a) => {
      if (!a.data) return;
      const date = dayjs(a.data);
      const dayIdx = date.day() === 0 ? 6 : date.day() - 1;
      const hour = date.hour();
      let period = "Madrugada";
      if (hour >= 6 && hour < 12) period = "Manhã";
      else if (hour >= 12 && hour < 18) period = "Tarde";
      else if (hour >= 18 && hour < 24) period = "Noite";

      const key = `${daysOfWeek[dayIdx]}-${period}`;
      if (timePatternMap[key]) {
        timePatternMap[key].lucro += a.valor_final || 0;
        timePatternMap[key].apostas += 1;
      }
    });

    const timePatternFormatted = Object.entries(timePatternMap)
      .map(([key, stats]) => {
        const [day, period] = key.split("-");
        return {
          day: day || "",
          period: period || "",
          lucro: stats.lucro,
          apostas: stats.apostas,
        };
      })
      .filter((x) => x.apostas > 0);
    setTimePatterns(timePatternFormatted);

    // ===== RISK METRICS =====
    const returns = seriesData.map(s => s.lucro || 0);
    const avg = mean(returns);
    const std = Math.sqrt(mean(returns.map(r => Math.pow(r - avg, 2))));
    const sharpe = std > 0 ? (avg / std) * Math.sqrt(Math.max(1, returns.length)) : 0;

    let peak = 0, cum = 0, maxDD = 0;
    returns.forEach((r) => {
      cum += r;
      peak = Math.max(peak, cum);
      maxDD = Math.min(maxDD, cum - peak);
    });

    const wins = returns.filter(r => r > 0);
    const losses = returns.filter(r => r < 0);
    const profitFactor = losses.length > 0 ? Math.abs(sum(wins) / sum(losses)) : 0;

    setRiskMetrics({
      maxDrawdown: Math.abs(maxDD),
      sharpeRatio: sharpe,
      volatility: std,
      profitFactor,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-foreground mb-2">Análises Avançadas</h1>
        <p className="text-muted-foreground">Insights profundos sobre suas apostas</p>
      </motion.div>

      {/* KPIs da Aba Ativa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisForActiveTab.map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            <KPICard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 gap-2">
          <TabsTrigger value="visao-geral">📈 Visão Geral</TabsTrigger>
          <TabsTrigger value="casas">🏆 Casas</TabsTrigger>
          <TabsTrigger value="categorias">🎯 Categorias</TabsTrigger>
          <TabsTrigger value="odds">💹 Odds</TabsTrigger>
          <TabsTrigger value="padroes">⏰ Padrões</TabsTrigger>
          <TabsTrigger value="temporal">📊 Temporal</TabsTrigger>
          <TabsTrigger value="risco">🛡️ Risco</TabsTrigger>
          <TabsTrigger value="tipos">🎲 Tipos</TabsTrigger>
          <TabsTrigger value="insights">💎 Insights</TabsTrigger>
        </TabsList>

        {/* ABA 1: VISÃO GERAL */}
        <TabsContent value="visao-geral" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Lucro Acumulado</CardTitle>
              <CardDescription>Progressão temporal do seu desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Area type="monotone" dataKey="lucro" stroke="hsl(var(--chart-1))" fillOpacity={1} fill="url(#colorLucro)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Casa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={performanceByHouse.slice(0, 5).map(h => ({ ...h }))}
                      dataKey="apostas"
                      nameKey="casa"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {performanceByHouse.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} apostas`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Apostas Ganhas vs Perdidas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyPerformance.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="apostas" fill="hsl(var(--chart-1))" name="Total Apostas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 2: CASAS DE APOSTAS */}
        <TabsContent value="casas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Casas (Top 10)</CardTitle>
              <CardDescription>Ordenadas por ROI</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {performanceByHouse.slice(0, 10).map((casa, idx) => (
                  <div key={casa.casa} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{casa.casa}</p>
                      <p className="text-sm text-muted-foreground">{casa.apostas} apostas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-foreground">{formatPercentage(casa.roi)}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(casa.lucro)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Radar Comparativo (Top 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={performanceByHouse.slice(0, 5).map(h => ({
                  casa: h.casa,
                  ROI: h.roi,
                  "Taxa Acerto": h.taxaAcerto,
                  Apostas: h.apostas,
                }))}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="casa" stroke="hsl(var(--foreground))" />
                  <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                  <Radar name="Performance" dataKey="ROI" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução do Lucro por Casa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="lucro" stroke="hsl(var(--chart-1))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: CATEGORIAS */}
        <TabsContent value="categorias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lucro por Categoria (≥10 apostas)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={byCategoria.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="lucro" fill="hsl(var(--chart-2))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Apostas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={byCategoria.slice(0, 8)}
                      dataKey="apostas"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {byCategoria.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI vs Taxa de Acerto</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byCategoria.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="roi" fill="hsl(var(--chart-1))" name="ROI (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 4: ANÁLISE DE ODDS */}
        <TabsContent value="odds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ROI por Faixa de Odd</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={oddAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => `${value.toFixed(2)}%`} />
                  <Bar dataKey="roi" fill="hsl(var(--chart-3))">
                    {oddAnalysis.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.roi > 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução da Odd Média</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={oddSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Line type="monotone" dataKey="odd" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ganhas vs Perdidas por Faixa</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={oddAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="won" fill="hsl(var(--success))" name="Ganhas" stackId="a" />
                    <Bar dataKey="lost" fill="hsl(var(--destructive))" name="Perdidas" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 5: PADRÕES TEMPORAIS */}
        <TabsContent value="padroes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Heatmap: Dia × Período</CardTitle>
              <CardDescription>Lucro médio por combinação dia/período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="p-2 text-left text-muted-foreground">Dia</th>
                      <th className="p-2 text-center text-muted-foreground">Madrugada</th>
                      <th className="p-2 text-center text-muted-foreground">Manhã</th>
                      <th className="p-2 text-center text-muted-foreground">Tarde</th>
                      <th className="p-2 text-center text-muted-foreground">Noite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map(day => (
                      <tr key={day} className="border-b border-border">
                        <td className="p-2 font-semibold text-foreground">{day}</td>
                        {["Madrugada", "Manhã", "Tarde", "Noite"].map(period => {
                          const pattern = timePatterns.find(t => t.day === day && t.period === period);
                          const lucro = pattern?.lucro || 0;
                          const bgColor = lucro > 0 ? 'bg-success/20' : lucro < 0 ? 'bg-destructive/20' : 'bg-muted/20';
                          return (
                            <td key={period} className={`p-2 text-center ${bgColor}`}>
                              {pattern ? formatCurrency(lucro) : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lucro por Dia da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={
                    ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map(day => ({
                      day,
                      lucro: sum(timePatterns.filter(t => t.day === day).map(t => t.lucro))
                    }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="lucro" fill="hsl(var(--chart-4))">
                      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"].map((day, index) => {
                        const lucro = sum(timePatterns.filter(t => t.day === day).map(t => t.lucro));
                        return <Cell key={`cell-${index}`} fill={lucro > 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Apostas por Período do Dia</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={
                    ["Madrugada", "Manhã", "Tarde", "Noite"].map(period => ({
                      period,
                      apostas: sum(timePatterns.filter(t => t.period === period).map(t => t.apostas))
                    }))
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="apostas" fill="hsl(var(--chart-5))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA 6: PERFORMANCE TEMPORAL */}
        <TabsContent value="temporal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Mensal Combinada</CardTitle>
              <CardDescription>Lucro, ROI e Volume ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={monthlyPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="lucro" fill="hsl(var(--chart-1))" name="Lucro" />
                  <Line yAxisId="right" type="monotone" dataKey="roi" stroke="hsl(var(--chart-2))" name="ROI (%)" strokeWidth={2} />
                  <Area yAxisId="left" type="monotone" dataKey="apostas" fill="hsl(var(--chart-3))" stroke="hsl(var(--chart-3))" fillOpacity={0.3} name="Apostas" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabela Mensal Detalhada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="p-2 text-left text-muted-foreground">Mês</th>
                      <th className="p-2 text-right text-muted-foreground">Apostas</th>
                      <th className="p-2 text-right text-muted-foreground">Lucro</th>
                      <th className="p-2 text-right text-muted-foreground">ROI</th>
                      <th className="p-2 text-right text-muted-foreground">Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyPerformance.map((m, idx) => (
                      <tr key={idx} className="border-b border-border hover:bg-muted/50">
                        <td className="p-2 font-semibold text-foreground">{m.month}</td>
                        <td className="p-2 text-right text-foreground">{m.apostas}</td>
                        <td className={`p-2 text-right font-semibold ${m.lucro > 0 ? 'text-success' : 'text-destructive'}`}>
                          {formatCurrency(m.lucro)}
                        </td>
                        <td className="p-2 text-right text-foreground">{formatPercentage(m.roi)}</td>
                        <td className={`p-2 text-right ${m.variacao > 0 ? 'text-success' : 'text-destructive'}`}>
                          {m.variacao > 0 ? <ArrowUp className="inline w-4 h-4" /> : <ArrowDown className="inline w-4 h-4" />}
                          {Math.abs(m.variacao).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 7: GESTÃO DE RISCO */}
        <TabsContent value="risco" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-foreground">{riskMetrics.sharpeRatio.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Max Drawdown</p>
                  <p className="text-2xl font-bold text-destructive">{formatCurrency(riskMetrics.maxDrawdown)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Volatilidade</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(riskMetrics.volatility)}</p>
                </div>
                <div className="p-4 rounded-lg bg-success/10 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Profit Factor</p>
                  <p className="text-2xl font-bold text-success">{riskMetrics.profitFactor.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk-Return por Casa</CardTitle>
              <CardDescription>Dispersão: Volatilidade × ROI</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="volatility" name="Volatilidade" stroke="hsl(var(--muted-foreground))" type="number" />
                  <YAxis dataKey="roi" name="ROI" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => value.toFixed(2)}
                  />
                  <Scatter 
                    data={performanceByHouse.map(h => ({ volatility: h.volatility || 0, roi: h.roi, casa: h.casa }))} 
                    fill="hsl(var(--chart-1))" 
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Evolução do Drawdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} formatter={(value: number) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="lucro" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorDD)" />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 8: TIPOS DE APOSTA */}
        <TabsContent value="tipos" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta aba será implementada com análise detalhada por tipo de aposta (simples, múltipla, sistema, etc.)
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* ABA 9: INSIGHTS AVANÇADOS */}
        <TabsContent value="insights" className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Esta aba conterá análises avançadas: correlações, sequências, previsões e clustering de apostas similares.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
