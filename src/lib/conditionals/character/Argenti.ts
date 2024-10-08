import { Stats } from 'lib/constants'
import { ComputedStatsObject, ULT_TYPE } from 'lib/conditionals/conditionalConstants'
import { AbilityEidolon, gpuStandardAtkFinalizer, precisionRound, standardAtkFinalizer } from 'lib/conditionals/conditionalUtils'

import { Eidolon } from 'types/Character'
import { CharacterConditional } from 'types/CharacterConditional'
import { Form } from 'types/Form'
import { ContentItem } from 'types/Conditionals'
import { buffAbilityDefPen } from 'lib/optimizer/calculateBuffs'

export default (e: Eidolon): CharacterConditional => {
  const { basic, skill, ult, talent } = AbilityEidolon.SKILL_TALENT_3_ULT_BASIC_5

  const talentMaxStacks = (e >= 4) ? 12 : 10

  const basicScaling = basic(e, 1.00, 1.10)
  const skillScaling = skill(e, 1.20, 1.32)
  const ultScaling = ult(e, 1.60, 1.728)
  const ultEnhancedScaling = ult(e, 2.80, 3.024)
  const ultEnhancedExtraHitScaling = ult(e, 0.95, 1.026)
  const talentCrStackValue = talent(e, 0.025, 0.028)

  const content: ContentItem[] = [
    {
      formItem: 'switch',
      id: 'ultEnhanced',
      name: 'ultEnhanced',
      text: 'Enhanced ult',
      title: 'Enhanced ult',
      content: `Consumes 180 Energy and deals Physical DMG equal to ${precisionRound(ultEnhancedScaling * 100)}% of Argenti's ATK to all enemies,
      and further deals DMG for 6 extra time(s), with each time dealing Physical DMG equal to ${precisionRound(ultEnhancedExtraHitScaling * 100)}% of Argenti's ATK to a random enemy.`,
    },
    {
      formItem: 'switch',
      id: 'enemyHp50',
      name: 'enemyHp50',
      text: 'Enemy HP ≤ 50% DMG boost',
      title: 'Courage',
      content: `Deals 15% more DMG to enemies whose HP percentage is 50% or less.`,
    },
    {
      formItem: 'slider',
      id: 'talentStacks',
      name: 'talentStacks',
      text: 'Apotheosis stacks',
      title: 'Apotheosis stacks',
      content: `Increases CR by ${precisionRound(talentCrStackValue * 100)}% per stack, max of ${precisionRound(talentMaxStacks)} stacks.`,
      min: 0,
      max: talentMaxStacks,
    },
    {
      formItem: 'slider',
      id: 'ultEnhancedExtraHits',
      name: 'ultEnhancedExtraHits',
      text: 'Enhanced ult extra hits on target',
      title: 'Enhanced ult extra hits on target',
      content: `Enhanced Ult hits a random enemy for ${precisionRound(ultEnhancedExtraHitScaling * 100)}% ATK per hit.`,
      min: 0,
      max: 6,
    },
    {
      formItem: 'switch',
      id: 'e2UltAtkBuff',
      name: 'e2UltAtkBuff',
      text: 'E2 ult ATK buff',
      title: 'E2 ult ATK buff',
      content: `E2: If the number of enemies on the field equals to 3 or more, increases ATK by ${precisionRound(0.40 * 100)}% for 1 turn.`,
      disabled: e < 2,
    },
  ]

  return {
    content: () => content,
    teammateContent: () => [],
    defaults: () => ({
      ultEnhanced: true,
      talentStacks: talentMaxStacks,
      ultEnhancedExtraHits: 6,
      e2UltAtkBuff: true,
      enemyHp50: true,
    }),
    teammateDefaults: () => ({}),
    precomputeEffects: (x: ComputedStatsObject, request: Form) => {
      const r = request.characterConditionals

      // Skills
      x[Stats.CR] += (r.talentStacks) * talentCrStackValue

      // Traces

      // Eidolons
      x[Stats.CD] += (e >= 1) ? (r.talentStacks) * 0.04 : 0
      x[Stats.ATK_P] += (e >= 2 && r.e2UltAtkBuff) ? 0.40 : 0

      // Scaling
      x.BASIC_SCALING += basicScaling
      x.SKILL_SCALING += skillScaling
      x.ULT_SCALING += (r.ultEnhanced) ? ultEnhancedScaling : ultScaling
      x.ULT_SCALING += (r.ultEnhancedExtraHits) * ultEnhancedExtraHitScaling

      // BOOST
      x.ELEMENTAL_DMG += (r.enemyHp50) ? 0.15 : 0
      // Argenti's e6 ult buff is actually a cast type buff, not dmg type but we'll do it like this anyways
      buffAbilityDefPen(x, ULT_TYPE, 0.30, (e >= 6))

      x.BASIC_TOUGHNESS_DMG += 30
      x.SKILL_TOUGHNESS_DMG += 30
      x.ULT_TOUGHNESS_DMG += (r.ultEnhanced) ? 60 + 15 * r.ultEnhancedExtraHits : 60

      return x
    },
    precomputeMutualEffects: (x: ComputedStatsObject, request: Form) => {
    },
    finalizeCalculations: (x: ComputedStatsObject) => standardAtkFinalizer(x),
    gpuFinalizeCalculations: () => gpuStandardAtkFinalizer(),
  }
}
