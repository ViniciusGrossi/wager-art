# WagerArt - Gestão Inteligente de Apostas Esportivas

## 📊 Sobre o Projeto

WagerArt é uma plataforma premium de gestão de apostas esportivas, desenvolvida com foco em experiência visual elegante e funcionalidades robustas. Conectado ao Supabase para persistência de dados, oferece análises detalhadas, controle de banca e insights para maximizar resultados.

## ✨ Principais Funcionalidades

### Dashboard
- **KPIs em tempo real**: Total apostado, lucro, ROI, taxa de acerto
- **Visualizações por categoria**: Análises gerais, por casa e por tipo de aposta
- **Cards animados** com microinterações premium

### Apostas
- Gerenciamento completo do ciclo de apostas
- Filtros avançados (período, casa, tipo, status)
- Formulário inteligente com preview de retorno
- Suporte a apostas com bônus e turbo

### Resultados
- Conciliação rápida de apostas pendentes
- Sistema de cashout com preview de impacto
- Histórico detalhado de todas as operações

### Análises
- Gráficos elegantes de ROI e lucro
- Análise de sequências (streaks)
- Evolução de odds e momentum
- Taxa de acerto por período

### Banca
- Visão consolidada de todas as casas
- Controle de saldo em tempo real
- Histórico de transações

## 🛠️ Stack Tecnológica

- **Frontend**: React 18 + TypeScript
- **Estilo**: Tailwind CSS + shadcn/ui (Radix UI)
- **Animações**: Framer Motion
- **Gráficos**: Recharts
- **Tabelas**: TanStack Table
- **Formulários**: react-hook-form + zod
- **Backend**: Supabase
- **Estado**: Zustand
- **Datas**: dayjs

## 🎨 Design System

### Cores
- **Primary**: Verde/Emerald (#22c55e) - Ganhos e CTAs
- **Destructive**: Vermelho/Rose - Perdas e erros
- **Success**: Verde - Confirmações positivas
- **Warning**: Amarelo - Alertas e pendências
- **Muted**: Cinza - Elementos secundários

### Componentes
- Cards com efeito glass e hover lift
- Badges coloridas por status
- Animações suaves de entrada
- Skeletons para carregamento
- Toasts para feedback

## 🚀 Como Usar

### Instalação

```bash
# Clone o repositório
git clone <YOUR_GIT_URL>

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Adicione ao .env:
# VITE_SUPABASE_URL=your_url
# VITE_SUPABASE_ANON_KEY=your_key

# Inicie o servidor de desenvolvimento
npm run dev
```

### Estrutura de Dados

O projeto utiliza duas tabelas principais no Supabase:

**aposta**
- Campos: id, categoria, tipo_aposta, casa_de_apostas, valor_apostado, odd, valor_final, bonus, turbo, resultado, detalhes, partida, torneio, data

**bookies**
- Campos: id, name, balance, last_deposit, last_withdraw, last_update, created_at

### Regras de Negócio

#### Nova Aposta
- Valida saldo disponível (exceto para bônus)
- Debita stake da casa (apostas normais)
- Status inicial: Pendente

#### Resultados
- **Ganhou**: Credita stake + lucro (normal) ou só lucro (bônus)
- **Perdeu**: Mantém débito do stake (normal) ou sem impacto (bônus)
- **Cancelado**: Devolve stake (normal)
- **Cashout**: Credita valor do cashout

## 📱 Páginas

- `/` - Dashboard com visão geral
- `/apostas` - Gestão de apostas
- `/resultados` - Conciliação de resultados
- `/analises` - Estatísticas e gráficos
- `/banca` - Controle de casas de apostas

## 🎯 Próximos Passos

- [ ] Implementar tabelas com TanStack Table
- [ ] Adicionar gráficos interativos com Recharts
- [ ] Criar sistema de notificações
- [ ] Implementar exportação de dados
- [ ] Adicionar suporte a múltiplas moedas
- [ ] Desenvolver sistema de metas e limites

## 📄 Licença

Este projeto está sob a licença MIT.

## 🔗 Links Úteis

- [Documentação Lovable](https://docs.lovable.dev/)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Framer Motion](https://www.framer.com/motion/)

---

**URL do Projeto**: https://lovable.dev/projects/c7b54679-24fd-43c0-8496-aa5e2aa7fcfa
