-- Fix overly permissive policies
DROP POLICY IF EXISTS "Service role manages email drip" ON email_drip_queue;
CREATE POLICY "Users read own emails" ON email_drip_queue FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage leads" ON leads;
CREATE POLICY "Anyone can submit lead" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Security definer function to check admin without RLS recursion
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = user_id AND role = 'admin');
$$;

-- Admin bypass for all tables using is_admin()
CREATE POLICY "Admin full access profiles" ON profiles FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin full access videos" ON videos FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin full access bot_subscriptions" ON bot_subscriptions FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin full access bot_wallets" ON bot_wallets FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin full access feedback" ON feedback FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin full access email_drip_queue" ON email_drip_queue FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin full access leads" ON leads FOR ALL TO authenticated
  USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
