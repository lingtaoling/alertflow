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

  async answerAnalyticsQuery(
    query: string,
  ): Promise<{ alertAnalytics: false } | { alertAnalytics: true; answer: string }> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new ServiceUnavailableException('OpenAI API key is not configured');
    }

    const system = `You help operations teams with alert and incident analytics only.

First decide if the user's message is about alert analytics or closely related operational topics, for example:
alerting systems, incident monitoring, on-call and escalation, noise reduction, alert routing and grouping, SLIs/SLOs and error budgets in an alerting context, triage, dashboards or metrics that support alert response, runbooks for alerts, or similar.

If the message is NOT about these topics (e.g. unrelated trivia, personal chat, recipes, general coding homework with no alerting angle), respond with exactly this JSON and no other keys:
{"alertAnalytics":false}

When alertAnalytics is false: do not include "answer", profanity, insults, or any extra text outside the JSON.

If the message IS on-topic, respond with:
{"alertAnalytics":true,"answer":"<string>"}

where "answer" is your helpful response (use \\n for paragraph breaks; max 8000 characters), professional tone, no profanity.

Output a single JSON object only, no markdown fences.`;

    const user = `Question:\n${query}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];

    let lastErr = 'All models failed';
    for (const model of this.getModelChain()) {
      try {
        const raw = await this.chatCompletion(apiKey, model, messages);
        const parsed = this.parseAnswerJson(raw);
        if (!parsed.alertAnalytics) {
          return { alertAnalytics: false };
        }
        if (!parsed.answer?.trim()) {
          lastErr = 'Model returned an empty answer';
          continue;
        }
        return { alertAnalytics: true, answer: parsed.answer };
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

  private parseAnswerJson(
    text: string,
  ): { alertAnalytics: false } | { alertAnalytics: true; answer: string } {
    const trimmed = text.trim();
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = (fence ? fence[1] : trimmed).trim();
    try {
      const parsed = JSON.parse(raw) as { alertAnalytics?: unknown; answer?: unknown };
      if (parsed.alertAnalytics !== true && parsed.alertAnalytics !== false) {
        throw new Error('Model did not return alertAnalytics boolean');
      }
      if (parsed.alertAnalytics === false) {
        return { alertAnalytics: false };
      }
      const answer = (parsed.answer ?? '').toString().trim().slice(0, 8000);
      if (!answer) {
        throw new Error('Model returned an empty answer');
      }
      return { alertAnalytics: true, answer };
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('Model')) throw e;
      throw new Error('Model did not return valid JSON');
    }
  }
}
