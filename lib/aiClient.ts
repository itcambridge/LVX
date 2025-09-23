import OpenAI from "openai";

// Create OpenAI client with error handling
export const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false // Ensure this is only used server-side
});

/**
 * Makes a request to OpenAI API using tool calling for structured outputs
 * @param system The system prompt
 * @param user The user input
 * @param schema The JSON schema for the expected output
 * @param toolName The name of the tool to call
 * @returns Validated response from the API
 */
export async function chatWithTools(system: string, user: string, schema: any, toolName: string) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      throw new Error("API key not configured");
    }

    // Make the API request with tool calling
    console.log(`Making OpenAI request with tool ${toolName}`);
    
    const res = await openai.chat.completions.create({
      model: "gpt-4-turbo", // More capable for structured outputs
      messages: [
        { role: "system", content: system }, 
        { role: "user", content: user }
      ],
      tools: [{
        type: "function",
        function: {
          name: toolName,
          description: `Process the ${toolName} stage of the debate algorithm`,
          parameters: schema
        }
      }],
      tool_choice: { type: "function", function: { name: toolName } },
      temperature: 0.7,
      max_tokens: 1500
    });

    // Extract the tool call response
    const toolCalls = res.choices[0]?.message?.tool_calls;
    if (!toolCalls || toolCalls.length === 0) {
      console.error("No tool calls in response");
      throw new Error("Invalid API response format");
    }

    // Parse the function arguments
    const functionCall = toolCalls[0];
    // Handle different types of tool calls (function or custom)
    if (functionCall.type === 'function') {
      return JSON.parse(functionCall.function.arguments);
    } else {
      console.error("Unexpected tool call type:", functionCall.type);
      throw new Error("Unsupported tool call type");
    }
  } catch (error: any) {
    // Handle API errors
    console.error("OpenAI API error:", error.message || error);
    throw error;
  }
}

/**
 * Fallback for the rewrite stage which doesn't return structured JSON
 * @param system The system prompt
 * @param user The user input
 * @returns Raw text response from the API
 */
export async function chatText(system: string, user: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      throw new Error("API key not configured");
    }

    const res = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: system }, 
        { role: "user", content: user }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    return res.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("OpenAI API error:", error.message || error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use chatWithTools instead
 */
export async function chatJSON(system: string, user: string) {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return JSON.stringify({
        error: "API key not configured",
        fallback: true,
        reflection: "I'm unable to process your request at this time due to configuration issues.",
        grievances: [{ text: "System configuration issue" }]
      });
    }

    console.log("WARNING: Using deprecated chatJSON function. Consider migrating to chatWithTools.");
    console.log("Making OpenAI request with system prompt:", system.substring(0, 50) + "...");
    
    const res = await openai.chat.completions.create({
      model: "gpt-4-turbo", // Upgraded from gpt-4o-mini
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system }, 
        { role: "user", content: user }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    // Extract the response
    const content = res.choices[0]?.message?.content;
    if (!content) {
      console.error("Empty response from OpenAI");
      return "{}";
    }

    return content;
  } catch (error: any) {
    // Handle API errors
    console.error("OpenAI API error:", error.message || error);
    
    // Return a fallback response
    return JSON.stringify({
      error: error.message || "Unknown error",
      fallback: true,
      reflection: "I encountered an error while processing your request.",
      grievances: [{ text: "Error in processing" }]
    });
  }
}
