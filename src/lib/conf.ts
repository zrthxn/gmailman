export const conf = {
  Black: (arg:string) => conf.colors.Black + arg + conf.colors.Reset,
  Red: (arg:string) => conf.colors.Red + arg + conf.colors.Reset,
  Green: (arg:string) => conf.colors.Green + arg + conf.colors.Reset,
  Yellow: (arg:string) => conf.colors.Yellow + arg + conf.colors.Reset,
  Blue: (arg:string) => conf.colors.Blue + arg + conf.colors.Reset,
  Magenta: (arg:string) => conf.colors.Magenta + arg + conf.colors.Reset,
  Cyan: (arg:string) => conf.colors.Cyan + arg + conf.colors.Reset,
  White: (arg:string) => conf.colors.White + arg + conf.colors.Reset,

  Line: (arg:string) => conf.format.Break + arg + conf.format.Break,

  copyright:'\u00A9',

  format: {
    Bold: '',
    Tab: '\t',
    Break: '\n',
    CRLF: '\r\n'
  },
  
  colors: {
    Black: '\u001b[30m',
    Red: '\u001b[31m',
    Green: '\u001b[32m',
    Yellow: '\u001b[33m',
    Blue: '\u001b[34m',
    Magenta: '\u001b[35m',
    Cyan: '\u001b[36m',
    White: '\u001b[37m',
    Reset: '\u001b[0m',
  }
}

export default conf