import { useState } from "react";
import type { SimulationEventInput } from "../../../server/engine/simulationAdapter";
import { trpc } from "@/lib/trpc";
import { AIChatBox, type Message } from "./AIChatBox";
import { Streamdown } from "streamdown";

export function MasterSportsAstrologer({event}:{event:SimulationEventInput}) {
  const [messages,setMessages]=useState<Message[]>([]);
  const reading=trpc.ai.sportsReading.useMutation();
  const chat=trpc.ai.sportsChat.useMutation();
  const conditions=trpc.schedules.conditions.useQuery(event,{staleTime:60_000,retry:1});
  const busy=reading.isPending || chat.isPending;
  const [conversationError,setConversationError]=useState("");
  async function send(content:string) {
    if(busy) return;
    if(messages.length>=20) {setConversationError("Start a new conversation for this game to continue. Your current messages remain visible.");return;}
    setConversationError("");
    const history=[...messages,{role:"user" as const,content}];
    setMessages(history);
    try {
      const response=await chat.mutateAsync({event,messages:history.map(message=>({role:message.role as "user"|"assistant",content:message.content}))});
      setMessages([...history,{role:"assistant",content:response.interpretation}]);
    } catch { /* Exact provider errors are shown below. */ }
  }
  return <section className="panel" style={{padding:20,marginBottom:20}}>
    <h2>AI Master Sports Astrologer</h2>
    <p>{event.teamA} vs {event.teamB} · {new Date(event.startTime).toLocaleString()}</p>
    <p>The analyst compares ranked evidence for both teams and explains the strongest opposing testimony.</p>
    <button className="button-primary" disabled={busy} onClick={()=>reading.mutate(event)}>{reading.isPending ? "Comparing the strongest evidence…" : "Generate full sports reading"}</button>
    {conversationError && <p role="alert">{conversationError}</p>}
    {(reading.error || chat.error) && <p role="alert" className="mt-3 text-rose-300">{(chat.error ?? reading.error)?.message}</p>}
    {conditions.data && <div className="mt-4 rounded-lg border border-amber-300/25 p-3">
      <strong>Pregame conditions</strong>
      <p>{conditions.data.weather ?? "Weather NOT VERIFIED"}</p>
      {conditions.data.notes.map((note,index)=><p key={index}>{note}</p>)}
    </div>}
    {reading.data && <div className="prose prose-invert my-5 max-w-none"><Streamdown>{reading.data.interpretation}</Streamdown></div>}
    <div className="mt-4"><AIChatBox messages={messages} onSendMessage={content=>void send(content)} isLoading={busy}
      height="430px" placeholder="Ask the master sports astrologer about this game…"
      emptyStateMessage="Ask about this matchup, its strongest methods, timing, or the evidence against the pick."
      suggestedPrompts={["Who has the strongest combined edge, and why?","Where do God View and Agent View disagree?","Explain the strongest planetary and lunar mansion evidence.","What weather and player availability information is missing?"]}/></div>
    {messages.length>=18 && <button className="button-secondary" disabled={busy} onClick={()=>{setMessages([]);setConversationError("");chat.reset();}}>Start a new conversation for this game</button>}
  </section>;
}
