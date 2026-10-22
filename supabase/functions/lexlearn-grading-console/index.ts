// HTML pages are served by GitHub Pages, not the default Supabase Functions hostname.
// Supabase rewrites text/html to text/plain on its default domain.
// This endpoint is a no-secret compatibility redirect for previous links.
const TARGET="https://ahmadfoad361-sketch.github.io/lexlearn-ai-demo/lexlearn-grading-console.html";
Deno.serve((req:Request)=>{
 if(req.method!=="GET"&&req.method!=="HEAD")return new Response("Method Not Allowed",{status:405,headers:{"Cache-Control":"no-store"}});
 return new Response(null,{status:302,headers:{"Location":TARGET,"Cache-Control":"no-store","Referrer-Policy":"no-referrer"}});
});
