# yCRV

## Price proxy configuration

The browser reads token prices from `NEXT_PUBLIC_PRICES_PROXY_URL`. It defaults to the same-origin
`/api/prices/spot` route for server-hosted Next.js deployments. Set `YEARN_PRICES_API_KEY` only in
that server environment; the route forwards the bearer key to Yearn Price Service.

The `yarn export` workflow produces a static site. Static deployments must set
`NEXT_PUBLIC_PRICES_PROXY_URL` at build time to an external authenticated proxy that allows the
site's origin and implements the `{ prices, missing, stale, errors }` response contract documented
in `.env.example`. The `yearn.fi` public proxy uses a different response envelope. This repository
does not configure or verify an external static-site proxy.
