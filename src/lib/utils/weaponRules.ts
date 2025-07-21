export type WeaponRule = {
  code?: string
  ruleName: string
  description: string
}

export function parseWeaponRules(
  allRules: WeaponRule[],
  WR: string
): WeaponRule[] {
  const parsed: WeaponRule[] = []

  // Tokens are the individual specials passed in (split on space)
  const tokens = WR.toUpperCase().trim().split(/,/)

  // Trim any whitespace from each token
  for (let i = 0; i < tokens.length; i++) {
    tokens[i] = tokens[i].trim()
  }

  // Sort allRules by length (so PrcCrit_ takes precedence over Prc_)
  allRules = allRules.sort((a, b) => (b.code?.length ?? 0) - (a.code?.length ?? 0));
  
  // For each token/special passed in
  for (const token of tokens) {
    // Find matches - Either exact match or replace on param "_"
    const matched = allRules.find(rule =>
      rule.code?.includes('_')
        ? token.startsWith(rule.code.replace('_', ''))
        : rule.code === token
    )

    if (matched && matched.code) {
      // Find the param if we have one (e.g. LDR2 would have param 2)
      const param = matched.code.includes('_')
        ? token.replace(matched.code.replace('_', ''), '')
        : undefined

      const code = matched.code.replaceAll('_', param || '')
      const description =  matched.description.replaceAll('_', param || '')
      const ruleName = matched.ruleName.replaceAll('_', param || '')

      parsed.push({
        code: code,
        ruleName: ruleName,
        description: description
      })
    } else {
      parsed.push({
        code: token,
        ruleName: token,
        description: token.startsWith('*') ? 'See Abilities' : '(Unknown rule)',
      })
    }
  }

  return parsed
}
