import {
  Injectable,
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type OpenAIChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string; code?: string };
};

const DEFAULT_MODELS = ['gpt-5.4', 'gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'];

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  private getApiKey(): string | undefined {
    return (
      this.config.get<string>('OPENAI_API_KEY')?.trim() ||
      this.config.get<string>('API_KEY')?.trim()
    );
  }

  private getModelChain(): string[] {
    const primary = this.config.get<string>('OPENAI_MODEL')?.trim();
    const extra = this.config.get<string>('OPENAI_MODEL_FALLBACKS');
    const fromEnv = extra
      ?.split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    if (primary && fromEnv?.length) return [primary, ...fromEnv];
    if (primary) return [primary, ...DEFAULT_MODELS.filter((m) => m !== primary)];
    return [...DEFAULT_MODELS];
  }

  async suggestAlertContent(draftTitle: string): Promise<{ title: string; description: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException('OpenAI API key is not configured');
    }

    const system = `You help refine incident alerts. The user provides a short draft (keywords or rough text).
Respond with a single JSON object only, no markdown, with keys:
- "title": clear, concise alert title (max 200 characters)
- "description": helpful description for responders (max 2000 characters; can be empty string if draft is enough as title only)

Use professional tone.`;

    const user = `Draft:\n${draftTitle}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    let lastErr = 'All models failed';
    for (const model of this.getModelChain()) {
      try {
        const raw = await this.chatCompletion(apiKey, model, messages);
        const parsed = this.parseAssistantJson(raw);
        const title = (parsed.title ?? '').toString().trim().slice(0, 200);
        const description = (parsed.description ?? '').toString().trim().slice(0, 2000);
        if (!title) {
          lastErr = 'Model returned an empty title';
          continue;
        }
        return { title, description };
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        if (!this.shouldTryNextModel(e)) break;
      }
    }

    throw new BadGatewayException(lastErr);
  }

  private shouldTryNextModel(err: unknown): boolean {
    const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
    return (
      msg.includes('model') ||
      msg.includes('does not exist') ||
      msg.includes('not found') ||
      msg.includes('invalid_model') ||
      msg.includes('response_format') ||
      msg.includes('json_object')
    );
  }

  private async chatCompletion(
    apiKey: string,
    model: string,
    messages: ChatMessage[],
  ): Promise<string> {
    const body: Record<string, unknown> = {
      model,
      messages,
      temperature: 0.4,
    };

    if (!model.includes('gpt-3.5')) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as OpenAIChatResponse;

    if (!res.ok) {
      const msg = data.error?.message ?? res.statusText;
      throw new Error(msg || `OpenAI HTTP ${res.status}`);
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error('Empty completion');
    return content;
  }

  private parseAssistantJson(text: string): { title?: string; description?: string } {
    const trimmed = text.trim();
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = (fence ? fence[1] : trimmed).trim();
    try {
      return JSON.parse(raw) as { title?: string; description?: string };
    } catch {
      throw new Error('Model did not return valid JSON');
    }
  }
}
