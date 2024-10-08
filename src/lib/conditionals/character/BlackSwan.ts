import { ComputedStatsObject, DOT_TYPE } from 'lib/conditionals/conditionalConstants'
import { AbilityEidolon, findContentId, gpuStandardAtkFinalizer, precisionRound, standardAtkFinalizer } from 'lib/conditionals/conditionalUtils'

import { Eidolon } from 'types/Character'
import { CharacterConditional } from 'types/CharacterConditional'
import { Form } from 'types/Form'
import { ContentItem } from 'types/Conditionals'
import { buffAbilityDefPen, buffAbilityVulnerability } from 'lib/optimizer/calculateBuffs'
import { BlackSwanConversionConditional } from 'lib/gpu/conditionals/dynamicConditionals'

export default (e: Eidolon): CharacterConditional => {
  const { basic, skill, ult, talent } = AbilityEidolon.SKILL_TALENT_3_ULT_BASIC_5

  const arcanaStackMultiplier = talent(e, 0.12, 0.132)
  const epiphanyDmgTakenBoost = ult(e, 0.25, 0.27)
  const defShredValue = skill(e, 0.208, 0.22)

  const basicScaling = basic(e, 0.60, 0.66)
  const skillScaling = skill(e, 0.90, 0.99)
  const ultScaling = ult(e, 1.20, 1.30)
  const dotScaling = talent(e, 2.40, 2.64)

  const dotChance = talent(e, 0.65, 0.68)

  // e6 100%
  // skill 100%

  const content: ContentItem[] = [
    {
      formItem: 'switch',
      id: 'ehrToDmgBoost',
      name: 'ehrToDmgBoost',
      text: 'EHR to DMG boost',
      title: 'EHR to DMG boost',
      content: `Increases this unit's DMG by an amount equal to 60% of Effect Hit Rate, up to a maximum DMG increase of 72%.`,
    },
    {
      formItem: 'switch',
      id: 'epiphanyDebuff',
      name: 'epiphanyDebuff',
      text: 'Epiphany debuff',
      title: 'Epiphany debuff',
      content: `Enemies affected by Epiphany take ${precisionRound(epiphanyDmgTakenBoost * 100)}% more DMG in their turn.`,
    },
    {
      formItem: 'switch',
      id: 'defDecreaseDebuff',
      name: 'defDecreaseDebuff',
      text: 'Def decrease debuff',
      title: 'Skill def decrease debuff',
      content: `Enemies DEF is decreased by ${precisionRound(defShredValue * 100)}%.`,
    },
    {
      formItem: 'slider',
      id: 'arcanaStacks',
      name: 'arcanaStacks',
      text: 'Arcana stacks',
      title: 'Arcana stacks',
      content: `While afflicted with Arcana, enemy targets receive Wind DoT equal to ${precisionRound(dotScaling * 100)}% of Black Swan's ATK at the start of each turn. Each stack of Arcana increases this DoT DMG multiplier by ${precisionRound(arcanaStackMultiplier * 100)}%. Arcana can stack up to 50 times. 
    ::BR::
When there are 3 or more Arcana stacks, deals Wind DoT to adjacent targets. When there are 7 or more Arcana stacks, enables the current DoT dealt this time to ignore 20% of the target's and adjacent targets' DEF.`,
      min: 1,
      max: 50,
    },
    {
      formItem: 'switch',
      id: 'e1ResReduction',
      name: 'e1ResReduction',
      text: 'E1 RES reduction',
      title: 'E1 RES reduction',
      content: `E1: While Black Swan is active in battle, enemies afflicted with Wind Shear, Bleed, Burn, or Shock will have their corresponding Wind, Physical, Fire, or Lightning RES respectively reduced by 25%.`,
      disabled: e < 1,
    },
  ]

  const teammateContent: ContentItem[] = [
    findContentId(content, 'epiphanyDebuff'),
    findContentId(content, 'defDecreaseDebuff'),
    findContentId(content, 'e1ResReduction'),
  ]

  return {
    content: () => content,
    teammateContent: () => teammateContent,
    defaults: () => ({
      ehrToDmgBoost: true,
      epiphanyDebuff: true,
      defDecreaseDebuff: true,
      arcanaStacks: 7,
      e1ResReduction: true,
    }),
    teammateDefaults: () => ({
      epiphanyDebuff: true,
      defDecreaseDebuff: true,
      e1ResReduction: true,
    }),
    precomputeEffects: (x: ComputedStatsObject, request: Form) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const r = request.characterConditionals

      x.BASIC_SCALING += basicScaling
      x.SKILL_SCALING += skillScaling
      x.ULT_SCALING += ultScaling
      x.DOT_SCALING += dotScaling + arcanaStackMultiplier * r.arcanaStacks

      buffAbilityDefPen(x, DOT_TYPE, 0.20, (r.arcanaStacks >= 7))

      x.BASIC_TOUGHNESS_DMG += 30
      x.SKILL_TOUGHNESS_DMG += 60
      x.ULT_TOUGHNESS_DMG += 60

      x.DOT_CHANCE = dotChance
      x.DOT_SPLIT = 0.05
      x.DOT_STACKS = r.arcanaStacks

      return x
    },
    precomputeMutualEffects: (x: ComputedStatsObject, request: Form) => {
      const m = request.characterConditionals

      // TODO: Technically this isnt a DoT vulnerability but rather vulnerability to damage on the enemy's turn which includes ults/etc.
      buffAbilityVulnerability(x, DOT_TYPE, epiphanyDmgTakenBoost, (m.epiphanyDebuff))

      x.DEF_PEN += (m.defDecreaseDebuff) ? defShredValue : 0
      x.WIND_RES_PEN += (e >= 1 && m.e1ResReduction) ? 0.25 : 0
      x.FIRE_RES_PEN += (e >= 1 && m.e1ResReduction) ? 0.25 : 0
      x.PHYSICAL_RES_PEN += (e >= 1 && m.e1ResReduction) ? 0.25 : 0
      x.LIGHTNING_RES_PEN += (e >= 1 && m.e1ResReduction) ? 0.25 : 0
    },
    finalizeCalculations: (x: ComputedStatsObject) => standardAtkFinalizer(x),
    gpuFinalizeCalculations: () => gpuStandardAtkFinalizer(),
    dynamicConditionals: [BlackSwanConversionConditional],
  }
}
