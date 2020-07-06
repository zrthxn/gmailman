const mailer = require('../build/index');
const { GMailer } = require('../build/index');

test('import', _ => {
  new GMailer({
    userId: '',
    username: ''
  });
});

test('maildir', _ => {
  mailer.addAccount('test', '', 'Test');
})
