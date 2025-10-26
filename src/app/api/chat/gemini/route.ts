import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAvailableGeminiKey } from '@/lib/supabase/geminiKeyRouter';

// Remove hardcoded API key - now using dynamic key routing
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { message, imageData, conversationHistory, schoolContext } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get API key from Supabase Edge Function (no fallback)
    let apiKeyData;
    try {
      apiKeyData = await getAvailableGeminiKey();
      console.log(`Using Supabase key pool: ${apiKeyData.keyId}, Remaining: ${apiKeyData.remainingDaily} daily, ${apiKeyData.remainingMinute} per minute`);
    } catch (error: any) {
      console.error('Failed to get API key from Supabase:', error.message);
      return NextResponse.json(
        { error: 'Unable to get API key. Please ensure the Supabase Edge Function is deployed.' },
        { status: 503 }
      );
    }

    // Initialize Gemini with the obtained key
    const genAI = new GoogleGenerativeAI(apiKeyData.apiKey);
    // Use gemini-2.0-flash - fast and supports streaming
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash'
    });

    // Build the context-aware prompt
    const systemPrompt = `You are Luminex AI, an intelligent learning assistant from Catalyst Innovations, helping ${schoolContext?.studentName || 'a student'} at ${schoolContext?.schoolName || 'school'}.
    
Your role is to:
- Help students understand concepts, not just give answers
- Guide them through problem-solving step by step
- Encourage critical thinking and learning
- Be supportive and patient
- Use clear, age-appropriate language

## IMPORTANT FORMATTING RULES:

1. **Use Emojis**: Start sections with relevant emojis (📚 for concepts, 💡 for tips, ✨ for examples, 🎯 for goals, ⚠️ for warnings, ✅ for correct answers, etc.)

2. **Use Headings**: Structure your response with clear headings:
   - Use ## for main sections
   - Use ### for subsections
   - Example: "## 📚 Understanding the Concept"

3. **Format Lists**: 
   - Use numbered lists (1. 2. 3.) for sequential steps
   - Use bullet points (- or *) for non-sequential items

4. **Code Blocks**: Use triple backticks with language name:
   \`\`\`python
   code here
   \`\`\`

5. **Emphasis**: Use **bold** for important terms and *italics* for emphasis

6. **Examples Structure**:
   ## 📚 Understanding [Topic]
   
   [Clear explanation]
   
   ## 💡 Step-by-Step Solution
   
   1. First step...
   2. Second step...
   
   ## ✨ Example
   
   [Concrete example]
   
   ## 🎯 Practice Exercise
   
   [Optional practice problem]

Previous conversation context is provided for continuity.`;

    // Format conversation history
    let contextMessages = '';
    if (conversationHistory && conversationHistory.length > 0) {
      contextMessages = '\n\nPrevious conversation:\n';
      conversationHistory.forEach((msg: any) => {
        contextMessages += `${msg.role === 'user' ? 'Student' : 'Helper'}: ${msg.content}\n`;
      });
    }

    // Prepare the content parts for Gemini
    const contentParts: any[] = [];
    
    // Add the text prompt
    const fullPrompt = systemPrompt + contextMessages + '\n\nStudent: ' + message;
    contentParts.push({ text: fullPrompt });
    
    // Handle image if provided (convert base64 to proper format)
    if (imageData && schoolContext?.imageAttached) {
      // Extract base64 data and mime type
      const base64Match = imageData.match(/^data:(image\/\w+);base64,(.+)$/);
      if (base64Match) {
        const mimeType = base64Match[1];
        const base64Data = base64Match[2];
        
        contentParts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
        
        contentParts.push({ 
          text: '\n\nPlease analyze the image above and help me understand it. If there are any problems or questions shown, guide me through solving them step by step.' 
        });
      }
    }

    // Generate response with streaming
    const result = await model.generateContentStream(contentParts);

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              // Send as Server-Sent Events format
              const data = JSON.stringify({ text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          
          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Error in Gemini chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
