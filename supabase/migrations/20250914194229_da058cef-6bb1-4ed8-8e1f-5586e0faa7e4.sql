-- Drop the current policy that's too permissive
DROP POLICY "Public can view active share links by token" ON public.share_links;

-- Create a security definer function that only allows access by specific token
CREATE OR REPLACE FUNCTION public.get_share_by_token(share_token TEXT)
RETURNS TABLE(
    inquiry_id bigint,
    payload jsonb,
    created_at timestamp with time zone,
    expires_at timestamp with time zone
) AS $$
BEGIN
    -- Only return data if the token exists and hasn't expired
    RETURN QUERY
    SELECT s.inquiry_id, s.payload, s.created_at, s.expires_at
    FROM public.share_links s
    WHERE s.token = share_token
      AND (s.expires_at IS NULL OR s.expires_at > NOW())
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a very restrictive RLS policy that essentially blocks all direct table access
CREATE POLICY "Block direct access to share_links"
ON public.share_links
FOR SELECT
USING (false);

-- Allow authenticated users to manage share links (for creating/updating/deleting)
CREATE POLICY "Authenticated users can manage share_links"
ON public.share_links
FOR ALL
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Update the offers policy to use a security definer function as well
CREATE OR REPLACE FUNCTION public.get_offers_for_shared_inquiry(share_token TEXT)
RETURNS TABLE(
    id bigint,
    inquiry_id integer,
    insurer text,
    program_code text,
    base_sum_eur numeric,
    premium_eur numeric,
    payment_method text,
    features jsonb,
    filename text,
    created_at timestamp with time zone
) AS $$
BEGIN
    -- Only return offers if the token is valid and hasn't expired
    RETURN QUERY
    SELECT o.id, o.inquiry_id, o.insurer, o.program_code, 
           o.base_sum_eur, o.premium_eur, o.payment_method, 
           o.features, o.filename, o.created_at
    FROM public.offers o
    INNER JOIN public.share_links s ON o.inquiry_id = s.inquiry_id
    WHERE s.token = share_token
      AND (s.expires_at IS NULL OR s.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a function to get feature values for shared offers
CREATE OR REPLACE FUNCTION public.get_feature_values_for_shared_inquiry(share_token TEXT)
RETURNS TABLE(
    offer_id bigint,
    feature_key text,
    value_text text,
    value_num numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT fv.offer_id, fv.feature_key, fv.value_text, fv.value_num
    FROM public.offer_feature_values fv
    INNER JOIN public.offers o ON fv.offer_id = o.id
    INNER JOIN public.share_links s ON o.inquiry_id = s.inquiry_id
    WHERE s.token = share_token
      AND (s.expires_at IS NULL OR s.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Make RLS policies more restrictive - block all public access to sensitive data
DROP POLICY IF EXISTS "Public can view offers for valid share links" ON public.offers;
DROP POLICY IF EXISTS "Public can view feature values for shared offers" ON public.offer_feature_values;

-- Only authenticated users can directly access offers and features
-- Public access must go through the security definer functions