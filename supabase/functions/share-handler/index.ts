import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔵 Share handler called:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // Get token from path for GET requests or from body for POST requests
    let token: string | null = null
    let requestBody: any = null
    
    if (req.method === 'GET') {
      console.log('🔵 GET request, extracting token from path');
      token = url.pathname.split('/').pop() || null
    } else if (req.method === 'POST') {
      console.log('🔵 POST request, parsing body');
      requestBody = await req.json()
      console.log('🔵 Request body:', JSON.stringify(requestBody));
      token = requestBody.token || null
    }
    
    console.log('🔵 Extracted token:', token);

    if (!token) {
      console.log('🔴 No token provided');
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log('🔵 Token validated:', token);

    // Create Supabase client with service role key for secure access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle update request (POST with action: 'update')
    if (req.method === 'POST' && requestBody?.action === 'update') {
      const { company_name, employees_count, view_prefs, propagate_offers } = requestBody

      // Build the update object for share_links.payload
      const { data: currentShare, error: fetchError } = await supabase
        .from('share_links')
        .select('payload, inquiry_id')
        .eq('token', token)
        .single()

      if (fetchError || !currentShare) {
        return new Response(
          JSON.stringify({ error: 'Share not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const updatedPayload = {
        ...currentShare.payload,
        ...(company_name !== undefined && { company_name }),
        ...(employees_count !== undefined && { employees_count }),
        ...(view_prefs !== undefined && { view_prefs })
      }

      // Update share_links.payload
      const { error: updateError } = await supabase
        .from('share_links')
        .update({ payload: updatedPayload })
        .eq('token', token)

      if (updateError) {
        console.error('Error updating share:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to update share' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Optionally propagate to underlying offers
      if (propagate_offers && currentShare.inquiry_id) {
        const offerUpdates: any = {}
        if (company_name !== undefined) offerUpdates.company_name = company_name
        if (employees_count !== undefined) offerUpdates.employee_count = employees_count

        if (Object.keys(offerUpdates).length > 0) {
          const { error: offersError } = await supabase
            .from('offers')
            .update(offerUpdates)
            .eq('inquiry_id', currentShare.inquiry_id)

          if (offersError) {
            console.error('Error updating offers:', offersError)
          }
        }
      }

      return new Response(
        JSON.stringify({ ok: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Handle GET/POST request to fetch share data
    console.log('🔵 Fetching share data for token:', token);
    
    // Get share data using secure function
    const { data: shareData, error: shareError } = await supabase.rpc(
      'get_share_by_token', 
      { share_token: token }
    )

    console.log('🔵 Share data response:', { shareData, shareError });

    if (shareError || !shareData || shareData.length === 0) {
      console.log('🔴 Share not found or expired');
      return new Response(
        JSON.stringify({ error: 'Share not found or expired' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const share = shareData[0]
    console.log('🔵 Share found:', { inquiry_id: share.inquiry_id, has_payload: !!share.payload });

    // Only fetch offers from database if inquiry_id exists
    // If document_ids exist in payload, frontend will fetch from external API
    let offers = []
    
    if (share.inquiry_id) {
      console.log('🔵 Fetching offers for inquiry_id:', share.inquiry_id);
      const { data: offersData, error: offersError } = await supabase.rpc(
        'get_offers_for_shared_inquiry',
        { share_token: token }
      )

      console.log('🔵 Offers data response:', { count: offersData?.length, error: offersError });

      if (offersError) {
        console.error('🔴 Error fetching offers:', offersError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch offers' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Transform offers data to expected format
      offers = offersData && offersData.length > 0 ? [{
        source_file: 'shared',
        inquiry_id: share.inquiry_id,
        programs: offersData.map((offer: any) => ({
          insurer: offer.insurer,
          program_code: offer.program_code,
          base_sum_eur: offer.base_sum_eur,
          premium_eur: offer.premium_eur,
          payment_method: offer.payment_method,
          company_name: offer.company_name,
          employee_count: offer.employee_count,
          features: offer.features || {}
        }))
      }] : []
    } else {
      console.log('🔵 No inquiry_id - document-based share, frontend will fetch offers');
    }

    const response = {
      ok: true,
      token: token,
      inquiry_id: share.inquiry_id,
      payload: share.payload,
      offers: offers
    }

    console.log('🟢 Returning response:', { ok: true, offers_count: offers.length });

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Share handler error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})