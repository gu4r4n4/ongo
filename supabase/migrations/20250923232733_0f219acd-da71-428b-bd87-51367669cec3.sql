-- Drop and recreate the get_offers_for_shared_inquiry function to include company_name and employee_count
DROP FUNCTION IF EXISTS public.get_offers_for_shared_inquiry(text);

CREATE OR REPLACE FUNCTION public.get_offers_for_shared_inquiry(share_token text)
 RETURNS TABLE(id bigint, inquiry_id integer, insurer text, program_code text, base_sum_eur numeric, premium_eur numeric, payment_method text, features jsonb, filename text, created_at timestamp with time zone, company_name text, employee_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only return offers if the token is valid and hasn't expired
    RETURN QUERY
    SELECT o.id, o.inquiry_id, o.insurer, o.program_code, 
           o.base_sum_eur, o.premium_eur, o.payment_method, 
           o.features, o.filename, o.created_at, o.company_name, o.employee_count
    FROM public.offers o
    INNER JOIN public.share_links s ON o.inquiry_id = s.inquiry_id
    WHERE s.token = share_token
      AND (s.expires_at IS NULL OR s.expires_at > NOW());
END;
$function$