export * from './bin/Mailer'
export * from './bin/DataEncoder'
export * from './bin/LoadBalancer'
export * from './bin/DistributionWorker'

export * from './lib/accounts'
export * from './lib/auth'
export * from './lib/templates'

export * from './index.d'

import { join } from 'path'
export const MAILDIR = join(process.cwd(), 'mail')