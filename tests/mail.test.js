var mailer = require('../build/index');
var { Mailer } = require('../build/index');

test('single static email', () => {
  var GMailer = new Mailer({
    userId: 'zrthxn@gmail.com',
    username: 'Alisamar Husain'
  });

  GMailer.SingleDelivery({
    to: 'zrthxn@gmail.com',
    subject: 'Test',
    body: 'This is a test email'
  });
});

// test('maildir', () => {
//   // mailer.addAccount('test', '', 'Test');
// })
