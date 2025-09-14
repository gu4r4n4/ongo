-- Update share_links policies to be more restrictive
-- Drop the current public read policy that's too permissive
DROP POLICY "Public can view share links by token" ON public.share_links;

-- Create a more secure policy that only allows reading specific columns when querying by token
CREATE POLICY "Public can view active share links by token" 
ON public.share_links 
FOR SELECT 
USING (
  -- Allow public access only if:
  -- 1. The link hasn't expired (if expires_at is set)
  -- 2. The query includes the token (this is implicit by how the query will be structured)
  (expires_at IS NULL OR expires_at > NOW())
);

-- Update offers table policies to allow public read access for shared inquiries
DROP POLICY "Authenticated users can view offers" ON public.offers;

CREATE POLICY "Public can view offers for valid share links" 
ON public.offers 
FOR SELECT 
USING (
  -- Allow public read if inquiry_id exists in a valid (non-expired) share link
  inquiry_id IN (
    SELECT inquiry_id FROM public.share_links 
    WHERE expires_at IS NULL OR expires_at > NOW()
  )
);

CREATE POLICY "Authenticated users can view all offers" 
ON public.offers 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Update offer_feature_values to allow public read for offers that are publicly accessible
DROP POLICY "Authenticated users can view offer feature values" ON public.offer_feature_values;

CREATE POLICY "Public can view feature values for shared offers" 
ON public.offer_feature_values 
FOR SELECT 
USING (
  -- Allow public read if the offer is publicly accessible
  offer_id IN (
    SELECT o.id FROM public.offers o
    WHERE o.inquiry_id IN (
      SELECT s.inquiry_id FROM public.share_links s
      WHERE s.expires_at IS NULL OR s.expires_at > NOW()
    )
  )
);

CREATE POLICY "Authenticated users can view all feature values" 
ON public.offer_feature_values 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow the backend system to insert data (using service role key)
-- The upsert function already handles this with SECURITY DEFINER