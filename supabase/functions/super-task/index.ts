import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers - required for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the structure of the request payload
interface IssuePayload {
  title: string;
  description: string;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  thumbnail: string;
}

// Log that the function server has started (for debugging purposes)
console.info('Edge Function Server Started');

// Set up the Edge function to handle incoming HTTP requests
serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the JSON payload from the request
    const { title, description, category, location, latitude, longitude, thumbnail }: IssuePayload = await req.json();
    
    console.log('Received issue:', { title, category, location });

    // Here, you can add logic to insert the issue into a Supabase table, if needed.
    // Example: await supabase.from('issues').insert({ title, description, category, location, latitude, longitude, thumbnail });

    // For now, just return a confirmation response
    const data = {
      message: `Issue successfully reported: ${title}`,
      issueDetails: {
        title,
        description,
        category,
        location,
        latitude,
        longitude,
        thumbnail,
      },
    };

    // Return the response with the details of the reported issue
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  } catch (error) {
    console.error('Error processing request:', error);
    // If an error occurs, return a 400 Bad Request with the error message
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
    );
  }
});
