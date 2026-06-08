import { streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
const mockProvider = (modelId) => ({
  specificationVersion: 'v1',
  provider: 'mock',
  modelId,
  doStream: async () => ({ stream: new ReadableStream(), rawCall: { request: {}, response: {} } })
})
async function main() {
  try {
    const result = await streamText({
      model: mockProvider('mock-model'),
      messages: [{ role: 'user', content: 'hello' }]
    });
    console.log("KEYS:", Object.keys(result));
    console.log("has toAIStreamResponse?", typeof result.toAIStreamResponse);
    console.log("has toDataStreamResponse?", typeof result.toDataStreamResponse);
  } catch (e) { console.error(e); }
}
main();
