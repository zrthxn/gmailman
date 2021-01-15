import fs from 'fs'
import path from 'path'

import { MAILDIR } from './index'
import { conf } from './lib/conf'

console.log(conf.Blue('Creating MAIL directory in cwd...'))

// SUB OPTIMAL
const ROOTDIR = path.resolve(path.join(MAILDIR, '../../../../', 'mail'))
const _init_config_ = JSON.stringify({
  accounts: {}, templates: {}
}, null, 2)

console.log(ROOTDIR)

// fs.existsSync(ROOTDIR)

export function initialize(options:string[] = []) {
  fs.mkdirSync(ROOTDIR, { recursive: true })

  fs.mkdirSync(path.join(ROOTDIR, 'auth'), { recursive: true })
  fs.mkdirSync(path.join(ROOTDIR, 'templates'), { recursive: true })
  fs.writeFileSync(path.join(ROOTDIR, 'gmailer.config.json'), _init_config_)

  console.log(conf.Green('Initialized MAILDIR'))
  console.log('It is recommended that you add the \"mail\" directory to your .gitignore file.')
}