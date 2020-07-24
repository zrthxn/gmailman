const mailer = require('../build/index');
const { Mailer } = require('../build/index');

test('import', () => {
  const GMailer = new Mailer({
    userId: '',
    username: ''
  });
});

// test('maildir', () => {
//   // mailer.addAccount('test', '', 'Test');
// })
