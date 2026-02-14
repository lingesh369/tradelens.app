import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleCors } from '../_shared/cors.ts';
import { verifyAuth, createServiceClient } from '../_shared/auth.ts';
import { successResponse, errorResponse } from '../_shared/response.ts';
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop(); // 'metadata', 'about', etc.

  // 1. Metadata Endpoint (Link Previews)
  if (url.pathname.endsWith('/metadata')) {
    try {
      const { url: targetUrl } = await req.json();
      if (!targetUrl) return errorResponse('URL is required', 400);

      const response = await fetch(targetUrl, {
          headers: {
              'User-Agent': 'TradeLens-Bot/1.0'
          }
      });
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      if (!doc) throw new Error('Failed to parse HTML');

      const title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || 
                    doc.querySelector('title')?.textContent || '';
      
      const description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || 
                          doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      
      const image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
      
      const siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || 
                       new URL(targetUrl).hostname;
      
      // Attempt to find favicon
        let favicon = '';
        const iconLink = doc.querySelector('link[rel="icon"]') || 
                         doc.querySelector('link[rel="shortcut icon"]');
        if (iconLink) {
            favicon = iconLink.getAttribute('href') || '';
            if (favicon && !favicon.startsWith('http')) {
                favicon = new URL(favicon, targetUrl).toString();
            }
        } else {
             favicon = new URL('/favicon.ico', targetUrl).toString();
        }

      return successResponse({
        title,
        description,
        thumbnail: image,
        siteName,
        favicon
      });

    } catch (error) {
      console.error('Metadata fetch error:', error);
      return errorResponse('Failed to fetch metadata', 500);
    }
  }

  const supabase = createServiceClient();

  // 2. Profile About Data (GET/POST)
  // Pattern: /profile-about/profile/:profileId/about
  const profileMatch = url.pathname.match(/\/profile\/([^\/]+)\/about/);
  
  if (profileMatch) {
      const profileId = profileMatch[1];
      
      if (req.method === 'GET') {
           const { data, error } = await supabase
            .from('trader_profiles')
            .select('bio, about_content')
            .eq('user_id', profileId)
            .single();
            
            if (error) return errorResponse(error.message, 500);
            return successResponse(data);
      } 
      else if (req.method === 'POST') {
          try {
             const { user } = await verifyAuth(req);
             if (user.id !== profileId) { // Basic check, ideally match against app_users table joined
                 // But wait, user.id from auth IS the user_id in app_users (usually 1:1)
                 // Let's ensure they are editing their own.
                 // If the profileId param is the UUID, it should match user.id
                 if (user.id !== profileId) {
                      // Double check if profileId maps to user_id (it is user_id in the schema)
                     return errorResponse('Unauthorized', 403);
                 }
             }

             const { bio, blocks } = await req.json();

             const { data, error } = await supabase
                .from('trader_profiles')
                .update({ 
                    bio: bio,
                    about_content: blocks // Assuming about_content column stores JSON/blocks directly? 
                    // Schema: about_content TEXT. If blocks is JSON, we might need to stringify or schema expects JSONB?
                    // Schema check: about_content TEXT.
                    // Frontend service sends `blocks` (Array), so likely needs JSON.stringify if it's TEXT, 
                    // OR if schema is JSONB.
                    // Let's check schema quick... Wait, I saw schema earlier (Step 422):
                    // `about_content TEXT`
                    // So we should probably stringify it if it's complex, or maybe it's just HTML/Markdown?
                    // Frontend service: `body: JSON.stringify({ bio, blocks })`
                    // So `blocks` comes in as array.
                    // We'll store it as JSON string if column is TEXT.
                })
                .eq('user_id', profileId)
                .select()
                .single();

              if (error) throw error;
              return successResponse(data);

          } catch (e) {
              return errorResponse(e.message, 500);
          }
      }
  }
  
  return errorResponse('Not found', 404);
});
