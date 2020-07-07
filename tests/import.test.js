const mailer = require('../build/index');
const { GMailer } = require('../build/index');

test('import', () => {
  new GMailer({
    userId: '',
    username: ''
  });
});

test('maildir', () => {
  // mailer.addAccount('test', '', 'Test');
})
