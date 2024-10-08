import { ComputedStatsObject } from 'lib/conditionals/conditionalConstants'
import { AbilityEidolon, findContentId, gpuStandardAtkFinalizer, precisionRound, standardAtkFinalizer } from 'lib/conditionals/conditionalUtils'

import { Eidolon } from 'types/Character'
import { CharacterConditional } from 'types/CharacterConditional'
import { Form } from 'types/Form'
import { ContentItem } from 'types/Conditionals'

export default (e: Eidolon): CharacterConditional => {
  const { basic, skill, ult, talent } = AbilityEidolon.SKILL_BASIC_3_ULT_TALENT_5

  const talentDebuffDmgIncreaseValue = talent(e, 0.07, 0.076)
  const talentDebuffMax = (e >= 6) ? 4 : 3

  const basicScaling = basic(e, 1.00, 1.10)
  const skillScaling = skill(e, 1.20, 1.32)
  const ultScaling = ult(e, 1.20, 1.296)
  const dotScaling = skill(e, 2.182, 2.40)

  const content: ContentItem[] = [
    {
      formItem: 'slider',
      id: 'talentDebuffStacks',
      name: 'talentDebuffStacks',
      text: 'Enemy Firekiss stacks',
      title: 'Enemy Firekiss stacks',
      content: `While inflicted with Firekiss, the enemy receives ${precisionRound(talentDebuffDmgIncreaseValue * 100)}% increased DMG, which lasts for 3 turns and can stack up to ${precisionRound(talentDebuffMax)} times.`,
      min: 0,
      max: talentDebuffMax,
    },
    {
      formItem: 'switch',
      id: 'enemyBurned',
      name: 'enemyBurned',
      text: 'Enemy burned',
      title: 'Enemy burned',
      content: `Increases DMG by ${precisionRound(0.20 * 100)}% against enemies affected by Burn.`,
    },
    {
      formItem: 'switch',
      id: 'skillDot',
      name: 'skillDot',
      text: 'Use Skill DoT chance',
      title: 'Use Skill DoT chance',
      content: `When enabled, uses the Skill's 100% DoT chance instead of the Basic's 80% DoT chance.`,
    },
    {
      formItem: 'switch',
      id: 'e1EffectResShred',
      name: 'e1EffectResShred',
      text: 'E1 Effect RES shred',
      title: 'E1 Effect RES shred',
      content: `E1: When Skill is used, there is a 100% base chance to reduce the attacked target enemy's Effect RES by 10% for 2 turn(s).`,
      disabled: e < 1,
    },
    {
      formItem: 'switch',
      id: 'e2BurnMultiBoost',
      name: 'e2BurnMultiBoost',
      text: 'E2 burn multi boost',
      title: 'E2 burn multi boost',
      content: `E2: When an enemy target is Burned, Guinaifen's Basic ATK and Skill can increase the DMG multiplier of their Burn status by 40%.`,
      disabled: e < 2,
    },
  ]

  const teammateContent: ContentItem[] = [
    findContentId(content, 'talentDebuffStacks'),
    findContentId(content, 'e1EffectResShred'),
  ]

  return {
    content: () => content,
    teammateContent: () => teammateContent,
    defaults: () => ({
      talentDebuffStacks: talentDebuffMax,
      enemyBurned: true,
      skillDot: true,
      e1EffectResShred: true,
      e2BurnMultiBoost: true,
    }),
    teammateDefaults: () => ({
      talentDebuffStacks: talentDebuffMax,
      e1EffectResShred: true,
    }),
    precomputeEffects: (x: ComputedStatsObject, request: Form) => {
      const r = request.characterConditionals

      // Scaling
      x.BASIC_SCALING += basicScaling
      x.SKILL_SCALING += skillScaling
      x.ULT_SCALING += ultScaling
      x.DOT_SCALING += dotScaling
      x.DOT_SCALING += (e >= 2 && r.e2BurnMultiBoost) ? 0.40 : 0

      // Boost
      x.ELEMENTAL_DMG += (r.enemyBurned) ? 0.20 : 0

      x.BASIC_TOUGHNESS_DMG += 30
      x.SKILL_TOUGHNESS_DMG += 60
      x.ULT_TOUGHNESS_DMG += 60

      x.DOT_CHANCE = r.skillDot ? 1.00 : 0.80

      return x
    },
    precomputeMutualEffects: (x: ComputedStatsObject, request: Form) => {
      const m = request.characterConditionals

      x.VULNERABILITY += m.talentDebuffStacks * talentDebuffDmgIncreaseValue
      x.EFFECT_RES_PEN += m.e1EffectResShred ? 0.10 : 0
    },
    finalizeCalculations: (x: ComputedStatsObject) => standardAtkFinalizer(x),
    gpuFinalizeCalculations: () => gpuStandardAtkFinalizer(),
  }
}
