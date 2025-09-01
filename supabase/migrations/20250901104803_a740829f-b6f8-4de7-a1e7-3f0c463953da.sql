-- Enable Row Level Security on all tables with sensitive data
ALTER TABLE public.insurance_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for insurance_inquiries table
-- Only authenticated users can view inquiries
CREATE POLICY "Authenticated users can view insurance inquiries" 
ON public.insurance_inquiries 
FOR SELECT 
TO authenticated 
USING (true);

-- Only authenticated users can insert inquiries
CREATE POLICY "Authenticated users can insert insurance inquiries" 
ON public.insurance_inquiries 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Only authenticated users can update inquiries
CREATE POLICY "Authenticated users can update insurance inquiries" 
ON public.insurance_inquiries 
FOR UPDATE 
TO authenticated 
USING (true);

-- Only authenticated users can delete inquiries
CREATE POLICY "Authenticated users can delete insurance inquiries" 
ON public.insurance_inquiries 
FOR DELETE 
TO authenticated 
USING (true);

-- Create RLS policies for invoices table
CREATE POLICY "Authenticated users can view invoices" 
ON public.invoices 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert invoices" 
ON public.invoices 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update invoices" 
ON public.invoices 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete invoices" 
ON public.invoices 
FOR DELETE 
TO authenticated 
USING (true);

-- Create RLS policies for leads table
CREATE POLICY "Authenticated users can view leads" 
ON public.leads 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert leads" 
ON public.leads 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads" 
ON public.leads 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete leads" 
ON public.leads 
FOR DELETE 
TO authenticated 
USING (true);

-- Create RLS policies for offers table
CREATE POLICY "Authenticated users can view offers" 
ON public.offers 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert offers" 
ON public.offers 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update offers" 
ON public.offers 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete offers" 
ON public.offers 
FOR DELETE 
TO authenticated 
USING (true);