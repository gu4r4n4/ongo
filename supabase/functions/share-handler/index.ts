import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const token = url.pathname.split('/').pop()

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role key for secure access
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle PATCH requests for updating share metadata
    if (req.method === 'PATCH') {
      const body = await req.json()
      const { company_name, employees_count } = body
      const propagateOffers = url.searchParams.get('propagate_offers') === '1'

      // Get current share data
      const { data: shareData, error: shareError } = await supabase.rpc(
        'get_share_by_token', 
        { share_token: token }
      )

      if (shareError || !shareData || shareData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Share not found or expired' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const share = shareData[0]
      
      // Update payload with new values
      const updatedPayload = {
        ...share.payload,
        company_name: company_name ?? share.payload.company_name,
        employees_count: employees_count ?? share.payload.employees_count
      }

      // Update share_links
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

      // Optionally propagate to offers
      if (propagateOffers) {
        const { error: offersError } = await supabase
          .from('offers')
          .update({
            company_name: company_name,
            employee_count: employees_count
          })
          .eq('inquiry_id', share.inquiry_id)

        if (offersError) {
          console.error('Error updating offers:', offersError)
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

    // Get share data using secure function
    const { data: shareData, error: shareError } = await supabase.rpc(
      'get_share_by_token', 
      { share_token: token }
    )

    if (shareError || !shareData || shareData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Share not found or expired' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const share = shareData[0]

    // Get offers data using secure function
    const { data: offersData, error: offersError } = await supabase.rpc(
      'get_offers_for_shared_inquiry',
      { share_token: token }
    )

    if (offersError) {
      console.error('Error fetching offers:', offersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch offers' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Transform offers data to expected format
    const offers = offersData && offersData.length > 0 ? [{
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

    const response = {
      ok: true,
      token: token,
      inquiry_id: share.inquiry_id,
      payload: share.payload,
      offers: offers
    }

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