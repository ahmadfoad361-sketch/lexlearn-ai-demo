import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import "../../../assets/showcase-recall.js";
import { createHandler } from "./handler.mjs";
Deno.serve(createHandler({createClient,env:(key:string)=>Deno.env.get(key),assess:(answer:string,lang:string)=>(globalThis as any).LEX_RECALL.assess(answer,lang)}));
