import Anthropic from '@anthropic-ai/sdk';

interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Calls Claude API with system and user prompts
export async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  options: LLMOptions = {}
): Promise<string> {
  const { temperature = 0.5, maxTokens = 4096 } = options;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
      temperature,
    });

    // Extract text from response
    const textBlock = response.content.find(block => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  } catch (err: unknown) {
    const error = err as { message?: string; status?: number };
    console.error('Claude API error:', error.message || error);
    throw new Error('Failed to generate content');
  }
}
