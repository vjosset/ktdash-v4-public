import { getRandom, getRandomInt, ucwords } from '../utils/utils'

export function name_fyhucho() {
  //Set the list of consonant phonemes
  const con = ['', '', '', '', '\'', 'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z', 'th', 'ph', 'ch', 'qu']
  
  //Set the list of vowel phonemes
  const vow = ['a', 'e', 'i', 'o', 'u', 'y', '']

  const minlen = 5
  const maxlen = 10
  
  const len = getRandomInt(minlen, maxlen)
  
  //Start building the name
  let name = ''

  for (let i = 0; i < len || name.length < minlen; i++) {
    const chars = i % 2 == 1 ? vow : con
    name += getRandom(chars)
  }
  
  //Done
  return ucwords(name)
}