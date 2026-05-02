export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Generate 3 unique website variations for: ${prompt}. Return as JSON array with objects containing: title, description, features (array), colorScheme, layout.`
          }]
        }]
      })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates[0]) {
      const generatedText = data.candidates[0].content.parts[0].text;
      
      // Try to parse as JSON, if fails create fallback
      let variations;
      try {
        variations = JSON.parse(generatedText);
      } catch {
        variations = [
          {
            title: "Modern Professional",
            description: "Clean and contemporary design",
            features: ["Responsive", "Fast Loading", "SEO Optimized"],
            colorScheme: "blue",
            layout: "modern"
          },
          {
            title: "Creative Bold",
            description: "Eye-catching and unique design",
            features: ["Animated", "Interactive", "Memorable"],
            colorScheme: "purple",
            layout: "creative"
          },
          {
            title: "Minimal Clean",
            description: "Simple and elegant design",
            features: ["Fast", "User-Friendly", "Accessible"],
            colorScheme: "gray",
            layout: "minimal"
          }
        ];
      }

      return new Response(JSON.stringify({ variations }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    throw new Error('No response from AI');
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Generation failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
