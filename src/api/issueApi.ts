// Supabase configuration
const SUPABASE_URL = "https://ypgoodjdxcnjysrsortp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_rs58HjDUbtkp9QvD7Li4VA_fqtAUF2u";
const API_URL = `${SUPABASE_URL}/functions/v1/api/issues`;

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
        Authorization: `Bearer ${sb_publishable_rs58HjDUbtkp9QvD7Li4VA_fqtAUF2u}`,
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
