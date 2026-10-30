-- ====================================================================
-- Billede Print Dashboard - Supabase Database Schema
-- Kør dette script i Supabase: "SQL Editor" -> "New query" -> "Run"
-- ====================================================================

-- 1. Opret 'orders' tabel
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  is_contact_group BOOLEAN NOT NULL DEFAULT false,
  toner_name_text TEXT NOT NULL DEFAULT '',
  toner_breakdown JSONB DEFAULT '[]'::jsonb,
  date TEXT NOT NULL,
  notes TEXT DEFAULT '',
  created_at BIGINT NOT NULL
);

-- 2. Opret 'toners' tabel
CREATE TABLE IF NOT EXISTS public.toners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  printed_count INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 108,
  notes TEXT DEFAULT ''
);

-- 3. Opret 'settings' tabel
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  paper_pack_price NUMERIC NOT NULL DEFAULT 170,
  prints_per_pack INTEGER NOT NULL DEFAULT 108,
  packs_per_purchase INTEGER NOT NULL DEFAULT 2,
  shipping_price NUMERIC NOT NULL DEFAULT 39,
  printer_cost NUMERIC NOT NULL DEFAULT 1000,
  tier_1_price NUMERIC DEFAULT 8.0,
  tier_3_price NUMERIC DEFAULT 7.0,
  tier_5_price NUMERIC DEFAULT 6.0,
  tier_10_price NUMERIC DEFAULT 5.5,
  tier_20_price NUMERIC DEFAULT 5.0,
  contact_group_price NUMERIC DEFAULT 5.0
);

-- Tilføj kolonner hvis tabellen allerede eksisterer
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tier_1_price NUMERIC DEFAULT 8.0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tier_3_price NUMERIC DEFAULT 7.0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tier_5_price NUMERIC DEFAULT 6.0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tier_10_price NUMERIC DEFAULT 5.5;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS tier_20_price NUMERIC DEFAULT 5.0;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS contact_group_price NUMERIC DEFAULT 5.0;

-- 4. Slå Row Level Security (RLS) til med tilladelse for anon adgang
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.toners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tillad alle operationer på orders" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Tillad alle operationer på toners" ON public.toners
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Tillad alle operationer på settings" ON public.settings
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Slå Supabase Realtime til for lynhurtig live-sync mellem PC og mobil
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.toners;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;

-- 6. Indsæt standard startdata (kun hvis tabellerne er tomme)
INSERT INTO public.settings (id, paper_pack_price, prints_per_pack, packs_per_purchase, shipping_price, printer_cost)
VALUES ('default', 170, 108, 2, 39, 1000)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.toners (id, name, status, printed_count, capacity, notes)
VALUES
  ('toner-1', 'Toner 1', 'finished', 4, 108, 'Brugt til Folke (4 prints) - Færdig nu'),
  ('toner-2', 'Toner 2', 'active', 17, 108, 'Aktiv patron. Indeholder Folke (2), Teng (1), Teng (12), Johannes (2)'),
  ('toner-3', 'Toner 3', 'ready', 0, 108, 'Klar i reserve'),
  ('toner-4', 'Toner 4', 'ready', 0, 108, 'Klar i reserve')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.orders (id, customer_name, quantity, unit_price, total_price, is_paid, is_contact_group, toner_name_text, toner_breakdown, date, notes, created_at)
VALUES
  ('ord-1', 'Folke', 6, 5.0, 30.0, false, true, 'Toner 1 (4 stk) / Toner 2 (2 stk)', '[{"tonerId": "toner-1", "count": 4}, {"tonerId": "toner-2", "count": 2}]'::jsonb, '2026-10-24', '4 prints på Toner 1 før skift, 2 prints på Toner 2', 1729760000000),
  ('ord-2', 'Teng', 1, 0.0, 0.0, true, false, 'Toner 2 (1 stk)', '[{"tonerId": "toner-2", "count": 1}]'::jsonb, '2026-10-25', 'Prøveprint / vennetjeneste', 1729846400000),
  ('ord-3', 'Teng', 12, 3.0, 36.0, true, false, 'Toner 2 (12 stk)', '[{"tonerId": "toner-2", "count": 12}]'::jsonb, '2026-10-26', 'Særpris aftalt (3 kr./stk)', 1729932800000),
  ('ord-4', 'Johannes', 2, 3.5, 7.0, true, false, 'Toner 2 (2 stk)', '[{"tonerId": "toner-2", "count": 2}]'::jsonb, '2026-10-27', 'Specialpris (3,5 kr./stk)', 1730019200000)
ON CONFLICT (id) DO NOTHING;
