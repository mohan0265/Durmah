import { LLMProvider, LLMRequest, LLMChunk, ProviderInfo, RequestContext } from "../types";

export class MistralLLM implements LLMProvider {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY || '';
  }
  
  info(): ProviderInfo {
    return {
      name: "mistral",
      version: "1.0.0",
      capabilities: ["llm:functions", "llm:tooluse"]
    };
  }
  
  async *complete(req: LLMRequest, ctx: RequestContext): AsyncIterable<LLMChunk> {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: req.model || 'mistral-large-latest',
        messages: req.messages,
        temperature: req.temperature || 0.2,
        max_tokens: req.maxTokens || 2048,
        stream: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`Mistral API error: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { done: true };
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              yield { delta };
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}
