import GMailer from '../src/bin/GMailer'

const mailer = new GMailer({ userId: 'zrthxn@gmail.com' })
test('single', ()=>{
  mailer.SingleDelivery({
    to: 'alisamar181099@gmail.com',
    body: 'Single Delivery Test'
  })
})