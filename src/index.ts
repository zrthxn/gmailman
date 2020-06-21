export * from './lib/accounts'
// export * from './lib/templates'
export * from './lib/auth'

export * from './bin/GMailer'
// export * from './bin/Budgets'
export * from './bin/DataEncoder'
export * from './bin/LoadBalancer'
export * from './bin/DistributionWorker'

export * from './index.d'

// TEST ----------------------------------------

// import GMailer from './bin/GMailer'

// const mailer = new GMailer({ userId: 'zrthxn@gmail.com', username: 'Alisamar Husain' })
// mailer.SingleDataDelivery({
//   to: 'alisamar181099@gmail.com',
//   subject: 'Test',
//   body: 'This Email is a {{ test }} test of your {{ quan }} capabilities'
// }, [
//   { id: 'test', data: 'successful' },
//   { id: 'quan', data: 'many' },
//   { id: 'attachment', data: '../../Desktop/IEEE/ORG.png' },
//   { id: 'attachment', data: '../../Desktop/IEEE/Certificate.png' },
// ]).then(()=>{
//   console.log('SENT')
// })