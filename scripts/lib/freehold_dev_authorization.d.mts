export declare const FREEHOLD_DEV_AUTHORIZATION_PATH: '/__freehold/dev-authorization';
export declare const FREEHOLD_DEV_AUTHORIZATION_BODY: '{"authorized":true}';

export interface FreeholdDevAuthorizationRequest {
  url?: string | undefined;
  method?: string | undefined;
  headers?: Record<string, string | string[] | undefined> | undefined;
  socket?: { remoteAddress?: string | undefined } | undefined;
}

export interface FreeholdDevAuthorizationResponse {
  statusCode: number;
  setHeader: (name: string, value: string) => void;
  end: (body?: string) => void;
}

export type FreeholdDevAuthorizationVerdict =
  | { kind: 'pass' }
  | { kind: 'allow' }
  | { kind: 'refuse'; status: 403 | 404 | 405; reason: string };

export interface FreeholdDevAuthorizationServer {
  middlewares: {
    use: (
      fn: (
        req: FreeholdDevAuthorizationRequest,
        res: FreeholdDevAuthorizationResponse,
        next: () => void,
      ) => void,
    ) => void;
  };
}

export interface FreeholdDevAuthorizationVitePlugin {
  name: string;
  apply: 'serve';
  configureServer(server: FreeholdDevAuthorizationServer): void;
}

export declare function freeholdDevAuthorizationEnabled(
  env: Record<string, string | undefined> | undefined,
): boolean;
export declare function classifyFreeholdDevAuthorizationRequest(
  req: FreeholdDevAuthorizationRequest | undefined,
): FreeholdDevAuthorizationVerdict;
export declare function freeholdDevAuthorizationPlugin(
  options: { enabled: boolean } | undefined,
): FreeholdDevAuthorizationVitePlugin;
