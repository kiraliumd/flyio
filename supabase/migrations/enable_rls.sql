-- Enable RLS on tickets table
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view their own tickets" 
ON tickets 
FOR SELECT 
USING (auth.uid() = agency_id);

-- Policy: Users can insert their own tickets
CREATE POLICY "Users can insert their own tickets" 
ON tickets 
FOR INSERT 
WITH CHECK (auth.uid() = agency_id);

-- Policy: Users can update their own tickets
CREATE POLICY "Users can update their own tickets" 
ON tickets 
FOR UPDATE 
USING (auth.uid() = agency_id);

-- Policy: Users can delete their own tickets
CREATE POLICY "Users can delete their own tickets" 
ON tickets 
FOR DELETE 
USING (auth.uid() = agency_id);
