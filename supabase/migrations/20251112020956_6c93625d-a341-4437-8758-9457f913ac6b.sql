-- Corrigir políticas RLS da tabela aposta para permitir INSERT
-- Remover políticas existentes se necessário
DROP POLICY IF EXISTS "INSERT" ON public.aposta;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.aposta;

-- Criar política permissiva para INSERT (permitir inserções públicas)
-- Se você implementar autenticação no futuro, ajuste para: WITH CHECK (auth.uid() IS NOT NULL)
CREATE POLICY "Enable insert for all users" 
ON public.aposta
FOR INSERT
TO public
WITH CHECK (true);

-- Garantir que as outras operações também estejam permitidas
DROP POLICY IF EXISTS "SELECT" ON public.aposta;
CREATE POLICY "Enable select for all users" 
ON public.aposta
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "UPDATE" ON public.aposta;
CREATE POLICY "Enable update for all users" 
ON public.aposta
FOR UPDATE
TO public
USING (true);

DROP POLICY IF EXISTS "DELETE" ON public.aposta;
CREATE POLICY "Enable delete for all users" 
ON public.aposta
FOR DELETE
TO public
USING (true);