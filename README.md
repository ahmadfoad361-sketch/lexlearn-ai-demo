# LexLearn public interface

This repository contains the public website and browser assets for LexLearn. Production authentication, student data, official assessment and training progression are enforced by the existing server APIs.

Backend implementation, database migrations, internal research, development fixtures and confidential integration tests are maintained separately in a private repository.

Build and check the public release:

```sh
node scripts/build-public.js
node scripts/security-public-boundary.cjs
node scripts/verify-public-links.cjs
```

The source boundary accepts only published website files and explicitly listed release infrastructure. Do not commit server source, database exports, credentials or internal validation material here.

The public demo runs in the browser, so its visible code and materials remain public. Removing internal files from the current branch does not retract previously published Git history or third-party copies.
