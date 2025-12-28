import axios from 'axios';

interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

// Calls OpenRouter API with system and user prompts
export async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const { temperature = 0.5, maxTokens = 4000 } = options;

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3-70b-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const output = response.data.choices?.[0]?.message?.content;
    return output || '';
  } catch (err: unknown) {
    const error = err as { response?: { data?: unknown }; message?: string };
    console.error('OpenRouter error:', error.response?.data || error.message);
    throw new Error('Failed to generate content');
  }
}
