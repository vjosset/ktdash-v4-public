export type WeaponRulePlain = {
  code: string;
  ruleName: string;
  description: string;
};

export class WeaponRule {
  code: string
  ruleName: string
  description: string

  constructor(data: {
    code: string
    ruleName: string
    description: string
  }) {
    this.code = data.code
    this.ruleName = data.ruleName
    this.description = data.description
  }

  toPlain(): WeaponRulePlain {
    return {
      code: this.code,
      ruleName: this.ruleName,
      description: this.description,
    }
  }
}
