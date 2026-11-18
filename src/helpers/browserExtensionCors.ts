import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Origins of the UpSignOn browser extension, as published on https://upsignon.eu/fr/downloads
// - Chrome: https://chromewebstore.google.com/detail/upsignon/ikddeecpbbbnfmnkldhnhjlljddnjbon
// - Edge: https://microsoftedge.microsoft.com/addons/detail/upsignon/jhglfkcppgkgenonjpoopfbobcdlffgg
// Their origin is `chrome-extension://<id>`, with an id that is stable.
const publishedChromiumExtensionIds = ['ikddeecpbbbnfmnkldhnhjlljddnjbon', 'jhglfkcppgkgenonjpoopfbobcdlffgg'];

// Firefox (`moz-extension://<uuid>`) and Safari (`safari-web-extension://<uuid>`) build the host of the origin
// from a random identifier, generated per installation: there is no id to list, so any host is accepted for them.
const randomHostExtensionOriginRegExp = /^(moz-extension|safari-web-extension):\/\/[a-zA-Z0-9._-]+$/;
const chromiumExtensionOriginRegExp = /^chrome-extension:\/\/([a-z]{32})$/;

// Outside production, any extension is accepted: unpacked builds have an id of their own.
const anyExtensionOriginRegExp = /^(chrome-extension|moz-extension|safari-web-extension):\/\/[a-zA-Z0-9._-]+$/;

// This is not an access control (CORS only protects browsers, and the routes stay protected by their own device
// authentication). Credentials are not allowed: the extension does not use cookies.
export function isBrowserExtensionOrigin(origin: string | undefined, isProduction: boolean): origin is string {
  if (origin === undefined) return false;
  if (!isProduction) return anyExtensionOriginRegExp.test(origin);
  if (randomHostExtensionOriginRegExp.test(origin)) return true;
  const chromiumId = chromiumExtensionOriginRegExp.exec(origin)?.[1];
  return chromiumId !== undefined && publishedChromiumExtensionIds.includes(chromiumId);
}

export function browserExtensionCors(isProduction: boolean): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (!isBrowserExtensionOrigin(origin, isProduction)) {
      return next();
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '600');
      res.sendStatus(204);
      return;
    }
    next();
  };
}
