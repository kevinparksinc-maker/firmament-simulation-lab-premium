import {afterEach,describe,expect,it,vi} from "vitest";
const config=vi.hoisted(()=>({anthropicApiKey:"test-only-key",anthropicModel:"test-model",forgeApiKey:"",forgeApiUrl:""}));
vi.mock("./_core/env",()=>({ENV:config}));
import {getSportsAIStatus,invokeLLM} from "./_core/llm";
afterEach(()=>{vi.unstubAllGlobals();config.anthropicApiKey="test-only-key";});
describe("sports Anthropic provider",()=>{
 it("sends full evidence and chat history without trimming",async()=>{
  const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({id:"test",model:"test-model",stop_reason:"end_turn",content:[{type:"text",text:"Sports reading"}]})});vi.stubGlobal("fetch",fetch);
  const evidence="calculated-result ".repeat(3000);
  const result=await invokeLLM({max_tokens:6500,messages:[{role:"system",content:"Master sports strategy"},{role:"user",content:evidence},{role:"assistant",content:"Earlier explanation"},{role:"user",content:"Explain the opposition"}]});
  const body=JSON.parse(fetch.mock.calls[0][1].body);
  expect(body.system).toBe("Master sports strategy");expect(body.messages[0].content).toBe(evidence);expect(body.messages).toHaveLength(3);expect(body.max_tokens).toBe(6500);
  expect(result.choices[0].message.content).toBe("Sports reading");expect(getSportsAIStatus().provider).toBe("anthropic");
 });
 it("does not publish a truncated reading",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({stop_reason:"max_tokens"})}));
  await expect(invokeLLM({messages:[]})).rejects.toThrow("SPORTS_AI_TRUNCATED");
 });
 it("gives an actionable error when no provider is configured",async()=>{
  config.anthropicApiKey="";
  await expect(invokeLLM({messages:[]})).rejects.toThrow("ANTHROPIC_API_KEY");
 });
});
