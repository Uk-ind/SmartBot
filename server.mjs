import "dotenv/config";
import express from "express";
import multer from "multer";
import OpenAI from "openai";
import path from "node:path";
import {fileURLToPath} from "node:url";
const __dirname=path.dirname(fileURLToPath(import.meta.url)),app=express();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:20*1024*1024}});
const client=process.env.OPENAI_API_KEY?new OpenAI({apiKey:process.env.OPENAI_API_KEY}):null;
const MODEL=process.env.OPENAI_MODEL||"gpt-5.6",PORT=Number(process.env.PORT||3000);
const INSTRUCTIONS=`You are SmartBot, a polished general-purpose AI assistant. Be useful, accurate, clear and warm. Match the user's requested detail. Never pretend to have accessed information, files, websites or tools you did not access. For current facts, use web search when enabled. When a file is supplied, use it as source material and distinguish source-derived facts from general knowledge. Use Markdown when useful.`;
app.use(express.json({limit:"2mb"}));app.use(express.static(path.join(__dirname,"public")));
const sse=(r,e,d)=>r.write(`event: ${e}\ndata: ${JSON.stringify(d)}\n\n`);
app.get("/api/health",(_,r)=>r.json({ok:true,configured:!!client,model:MODEL}));
app.post("/api/upload",upload.single("file"),async(req,res)=>{
 if(!client)return res.status(503).json({error:"Add OPENAI_API_KEY to .env."});
 if(!req.file)return res.status(400).json({error:"No file supplied."});
 try{const f=await client.files.create({file:new File([req.file.buffer],req.file.originalname,{type:req.file.mimetype}),purpose:"user_data"});res.json({id:f.id,name:req.file.originalname,size:req.file.size,type:req.file.mimetype})}
 catch(e){res.status(500).json({error:e.message||"Upload failed."})}
});
app.post("/api/chat",async(req,res)=>{
 if(!client)return res.status(503).json({error:"Add OPENAI_API_KEY to .env."});
 const {message,previousResponseId=null,fileIds=[],webSearch=false}=req.body||{};
 if(!message?.trim())return res.status(400).json({error:"Message required."});
 res.setHeader("Content-Type","text/event-stream; charset=utf-8");res.setHeader("Cache-Control","no-cache");res.setHeader("Connection","keep-alive");res.flushHeaders();
 try{
  const content=[{type:"input_text",text:message.trim()}];
  for(const id of Array.isArray(fileIds)?fileIds.slice(0,5):[])content.push({type:"input_file",file_id:id});
  const p={model:MODEL,instructions:INSTRUCTIONS,input:[{role:"user",content}],stream:true,...(previousResponseId?{previous_response_id:previousResponseId}:{})};
  if(webSearch)p.tools=[{type:"web_search"}];
  const stream=await client.responses.create(p);let responseId=null;
  for await(const ev of stream){
   if(ev.type==="response.output_text.delta")sse(res,"delta",{text:ev.delta||""});
   else if(ev.type==="response.completed")responseId=ev.response?.id||null;
   else if(ev.type==="response.failed")sse(res,"error",{message:ev.response?.error?.message||"Response failed."});
  }
  sse(res,"done",{responseId});res.end();
 }catch(e){sse(res,"error",{message:e.message||"Request failed."});res.end()}
});
app.get("*",(_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,()=>console.log(`SmartBot: http://localhost:${PORT}`));
