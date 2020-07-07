import fs from 'fs'
import path from 'path'

import { MAILDIR } from '../index'
import { conf } from './conf'

console.log(conf.Blue('Creating MAIL directory in cwd...'))

const ROOTDIR = path.resolve('../../../', MAILDIR)
const _init_config_ = JSON.stringify({
  accounts: {}, templates: {}
}, null, 2)

console.log(ROOTDIR)

fs.mkdirSync(ROOTDIR, { recursive: true })
fs.mkdirSync(path.join(ROOTDIR, 'auth'), { recursive: true })
fs.mkdirSync(path.join(ROOTDIR, 'templates'), { recursive: true })

fs.writeFileSync(path.join(path.resolve(MAILDIR, '../../../'), 'gmailer.config.json'), _init_config_)

console.log(conf.Green('Initialized MAILDIR'))