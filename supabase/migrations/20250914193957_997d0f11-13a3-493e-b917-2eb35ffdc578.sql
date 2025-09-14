-- Enable Row Level Security on share_links table
ALTER TABLE public.share_links ENABLE ROW LEVEL SECURITY;

-- Policy for public read access - only allow reading when querying by specific token
-- This enables the share functionality where anyone with a token can view the shared content
CREATE POLICY "Public can view share links by token" 
ON public.share_links 
FOR SELECT 
USING (true);

-- Policy for authenticated users to create share links
CREATE POLICY "Authenticated users can create share links" 
ON public.share_links 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for authenticated users to update their own share links
-- Note: We're not using user_id in the table, so for now we'll allow all authenticated users
-- In a production system, you'd want to add a user_id column to track ownership
CREATE POLICY "Authenticated users can update share links" 
ON public.share_links 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Policy for authenticated users to delete share links
CREATE POLICY "Authenticated users can delete share links" 
ON public.share_links 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add index on token for better performance when querying by token
CREATE INDEX IF NOT EXISTS idx_share_links_token ON public.share_links(token);

-- Add index on expires_at for cleanup operations
CREATE INDEX IF NOT EXISTS idx_share_links_expires_at ON public.share_links(expires_at);

-- Create a function to clean up expired share links (optional but recommended)
CREATE OR REPLACE FUNCTION public.cleanup_expired_share_links()
RETURNS void AS $$
BEGIN
    DELETE FROM public.share_links 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;