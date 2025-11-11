// MLH Verified Schools List
// This data is sourced from the schools.csv file
// Use this for the school dropdown in the application form

export const MLH_SCHOOLS = [
  "University of Toledo",
  "The University of Toledo",
  // Add more schools as needed from schools.csv
  // For full list, import from schools.csv during build
];

// Helper function to load schools from CSV
export async function loadSchoolsList(): Promise<string[]> {
  try {
    const response = await fetch('/schools.csv');
    
    // Get the raw bytes first
    const arrayBuffer = await response.arrayBuffer();
    
    // Check for UTF-16 LE BOM (FF FE)
    const uint8Array = new Uint8Array(arrayBuffer);
    let text: string;
    
    if (uint8Array.length >= 2 && uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
      // UTF-16 LE encoding detected
      const decoder = new TextDecoder('utf-16le');
      text = decoder.decode(arrayBuffer);
    } else if (uint8Array.length >= 3 && uint8Array[0] === 0xEF && uint8Array[1] === 0xBB && uint8Array[2] === 0xBF) {
      // UTF-8 with BOM
      const decoder = new TextDecoder('utf-8');
      text = decoder.decode(arrayBuffer.slice(3)); // Skip BOM
    } else {
      // Assume UTF-8
      const decoder = new TextDecoder('utf-8');
      text = decoder.decode(arrayBuffer);
    }
    
    const schools = text
      .split(/\r?\n/) // Handle both Unix and Windows line endings
      .map(line => {
        // Remove all quotes and trim whitespace
        return line.trim().replace(/^"+|"+$/g, '').replace(/"/g, '');
      })
      .filter(line => line.length > 0 && !line.startsWith('#')); // Filter out empty lines and comments
    
    return schools.sort();
  } catch (error) {
    console.error('Error loading schools list:', error);
    return [];
  }
}
