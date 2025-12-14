// Define the API URL for the Supabase Edge Function
const API_URL = "https://your-supabase-url.supabase.co/functions/v1/api/issues"; // Replace with your actual Supabase Edge Function URL

// This function will make the request to the backend
export const createIssue = async (issueData: {
  title: string;
  description: string;
  category: string;
  reportedBy: string;
  location: string;
  coordinates: { lat: number; lng: number };
  thumbnail: string;
}) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(issueData),
    });

    // Check if the response is ok (status 2xx)
    if (!response.ok) {
      throw new Error("Failed to create issue");
    }

    const data = await response.json(); // Parse the response to JSON
    return data; // Return the created issue data or a success message
  } catch (error) {
    console.error("Error creating issue:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
  }
};
