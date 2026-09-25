# GeduShop Security Bridge

Current version: `1.0.1`

Install and activate `gedushop-security` in WordPress before deploying the
frontend changes that store opaque order access tokens.

It provides:

- checkout idempotency for `X-Gedu-Idempotency-Key`;
- opaque per-order access tokens while retaining legacy phone + order lookup;
- rate limits for tracking, review, restock, and checkout writes;
- review input/photo validation and output sanitization;
- removal of public WordPress user enumeration; and
- XML-RPC/pingback/multicall shutdown.

The plugin uses WordPress transients and order metadata, so it needs no paid
service or additional database.
