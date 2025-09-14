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
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { inquiry_id, title, payload, expires_in_hours } = await req.json()

    if (!inquiry_id) {
      return new Response(
        JSON.stringify({ error: 'inquiry_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service role key for secure operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a secure random token
    const token = crypto.randomUUID().replace(/-/g, '') + 
                  Math.random().toString(36).substring(2, 15)

    // Calculate expiration time
    let expires_at = null
    if (expires_in_hours && expires_in_hours > 0) {
      const now = new Date()
      expires_at = new Date(now.getTime() + (expires_in_hours * 60 * 60 * 1000)).toISOString()
    }

    // Insert the share link record
    const { data, error } = await supabase
      .from('share_links')
      .insert({
        inquiry_id: inquiry_id,
        token: token,
        payload: payload || {},
        expires_at: expires_at
      })
      .select('token')
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create share link' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate the share URL
    const baseUrl = req.headers.get('origin') || Deno.env.get('SUPABASE_URL')
    const shareUrl = `${baseUrl}/share/${data.token}`

    const response = {
      token: data.token,
      url: shareUrl,
      expires_at: expires_at
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Create share error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})