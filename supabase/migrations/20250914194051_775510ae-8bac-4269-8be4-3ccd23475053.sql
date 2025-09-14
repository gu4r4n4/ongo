-- Enable RLS on offers table
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view offers
CREATE POLICY "Authenticated users can view offers" 
ON public.offers 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to create offers
CREATE POLICY "Authenticated users can create offers" 
ON public.offers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for authenticated users to update offers
CREATE POLICY "Authenticated users can update offers" 
ON public.offers 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to delete offers
CREATE POLICY "Authenticated users can delete offers" 
ON public.offers 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Enable RLS on offer_feature_values table
ALTER TABLE public.offer_feature_values ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view offer feature values
CREATE POLICY "Authenticated users can view offer feature values" 
ON public.offer_feature_values 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to create offer feature values
CREATE POLICY "Authenticated users can create offer feature values" 
ON public.offer_feature_values 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for authenticated users to update offer feature values
CREATE POLICY "Authenticated users can update offer feature values" 
ON public.offer_feature_values 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to delete offer feature values
CREATE POLICY "Authenticated users can delete offer feature values" 
ON public.offer_feature_values 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Fix function search paths for security
ALTER FUNCTION public.upsert_offer_with_features(p jsonb) SET search_path = public;
ALTER FUNCTION public.tg_set_updated_at() SET search_path = public;
ALTER FUNCTION public.cleanup_expired_share_links() SET search_path = public;