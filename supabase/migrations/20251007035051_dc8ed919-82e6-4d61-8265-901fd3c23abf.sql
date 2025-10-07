-- Drop the blocking policy and create proper public access policies for share functionality

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Block direct access to share_links" ON public.share_links;
DROP POLICY IF EXISTS "Authenticated users can view all offers" ON public.offers;
DROP POLICY IF EXISTS "Authenticated users can view all feature values" ON public.offer_feature_values;

-- Allow public read access to share_links (token validation happens in app logic)
CREATE POLICY "Public can read share_links"
  ON public.share_links
  FOR SELECT
  USING (true);

-- Allow public read access to offers (share validation happens through share_links)
CREATE POLICY "Public can read offers"
  ON public.offers
  FOR SELECT
  USING (true);

-- Allow public read access to offer_feature_values (share validation happens through offers)
CREATE POLICY "Public can read offer_feature_values"
  ON public.offer_feature_values
  FOR SELECT
  USING (true);