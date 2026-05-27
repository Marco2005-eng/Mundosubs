CREATE TABLE IF NOT EXISTS public.finance_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  category text NOT NULL DEFAULT 'service_purchase',
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  vendor text,
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_finance_expenses_occurred_at
ON public.finance_expenses(occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_finance_expenses_category
ON public.finance_expenses(category);

ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "finance_expenses_admin" ON public.finance_expenses;
CREATE POLICY "finance_expenses_admin"
ON public.finance_expenses
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid()
      AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users
    WHERE users.id = auth.uid()
      AND users.role = 'admin'
  )
);
