'use strict';

// Cross-platform cluster launcher: `npm run start:cluster`.
// Setting CLUSTER_ENABLED inline is awkward on Windows, so it is set here before
// server.js reads it.
process.env.CLUSTER_ENABLED = 'true';

require('../server').run();
