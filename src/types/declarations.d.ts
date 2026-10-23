declare module 'next/server.js' {
  export * from 'next/dist/server/web/exports/index';
}

declare module 'next/dist/lib/metadata/types/metadata-interface.js' {
  export type ResolvingMetadata = Promise<any>;
  export type ResolvingViewport = Promise<any>;
}
