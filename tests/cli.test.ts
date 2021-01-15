import { functions, encodeExecArgs } from '../src/cli'
import Prompts from '../src/prompts.json'

test('has prompts', () => {
  expect(Prompts).toBeDefined()
  expect(Prompts).toHaveProperty("prompts")
})

test('encoding', () => {
  expect(encodeExecArgs(['node','processChild.js','gmailman']))
    .toStrictEqual({exec: [], args: {}})
  
  expect(encodeExecArgs(['gmailman', 'account', 'add', '--userid=test', '--tag']))
    .toStrictEqual({exec: ['account', 'add'], args: { userid: "test", tag: true }})
})

test('functions idempotency', () => {
  for (const key in functions) {
    if (functions.hasOwnProperty(key)) {
      if (functions[key].hasOwnProperty('switch')) {
        expect(functions[key].switch(undefined)).toBe(functions[key].switch)
      }
    }
  }
})

// test('no infinity', () => {
//   for (const key in functions) {
//     if (functions.hasOwnProperty(key)) {
//       if (functions[key].hasOwnProperty('switch')) {
//         expect(functions[key].switch(null)).not.toHaveBeenLastCalledWith(null)
//       }
//     }
//   }
// })