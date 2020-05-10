import GMailer from './bin/GMailer'
import LoadBalancer from './bin/LoadBalancer'

const mailer = new GMailer({ userId: 'zrthxn@gmail.com' })
mailer.SingleDataDelivery({
  to: 'alisamar181099@gmail.com',
  subject: 'Test',
  body: 'This Email is a {{ test }} of your {{ quan }} capabilities'
}, [
  { id: 'test', data: 'successful' },
  { id: 'quan', data: 'many' }
]).then()