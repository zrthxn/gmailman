import fs from 'fs'
import path from 'path'

import { MAILDIR } from '../index'
import { conf } from './conf'

console.log(conf.Blue('Creating MAIL directory in cwd...'))

const _init_config_ = JSON.stringify({
  accounts: {}, templates: {}
}, null, 2)

fs.mkdirSync(MAILDIR, { recursive: true })
fs.mkdirSync(path.join(MAILDIR, 'auth'), { recursive: true })
fs.mkdirSync(path.join(MAILDIR, 'templates'), { recursive: true })

console.log()
fs.writeFileSync(path.join(MAILDIR, 'gmailer.config.json'), _init_config_)

console.log(conf.Green('Initialized MAILDIR'))