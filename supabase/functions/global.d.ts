// Type declarations for Deno in Supabase Edge Functions
// Prevents VS Code / IDE TypeScript from flagging Deno globals and https:// imports as errors

declare namespace Deno {
  export const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  };
}

declare module "https://deno.land/std@0.224.0/http/server.ts" {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): any;
}

declare module "https://*" {
  const content: any;
  export default content;
}

declare module "npm:*" {
  const content: any;
  export default content;
}

