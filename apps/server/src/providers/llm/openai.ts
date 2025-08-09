import { LLMProvider, LLMRequest, LLMChunk, ProviderInfo, RequestContext } from "../types";
import OpenAI from 'openai';

export class OpenAILLM implements LLMProvider {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  info(): ProviderInfo {
    return {
      name: "openai",
      version: "1.0.0",
      capabilities: ["llm:functions", "llm:realtime", "llm:tooluse"]
    };
  }
  
  async *complete(req: LLMRequest, ctx: RequestContext): AsyncIterable<LLMChunk> {
    const stream = await this.openai.chat.completions.create({
      model: req.model || process.env.OPENAI_MODEL_CHAT || 'gpt-4o',
      messages: req.messages,
      temperature: req.temperature || 0.2,
      max_tokens: req.maxTokens || 2048,
      stream: true
    });
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield { delta };
      }
    }
    
    yield { done: true };
  }
}
