import {
  AbilityType,
  SKILL_DMG_TYPE,
  ULT_DMG_TYPE,
} from 'lib/conditionals/conditionalConstants'
import {
  AbilityEidolon,
  Conditionals,
  ContentDefinition,
} from 'lib/conditionals/conditionalUtils'
import { Source } from 'lib/optimization/buffSource'
import { buffAbilityDmg } from 'lib/optimization/calculateBuffs'
import { ComputedStatsArray } from 'lib/optimization/computedStatsArray'
import { TsUtils } from 'lib/utils/TsUtils'
import { Eidolon } from 'types/character'
import { CharacterConditionalsController } from 'types/conditionals'
import {
  OptimizerAction,
  OptimizerContext,
} from 'types/optimizer'

export default (e: Eidolon, withContent: boolean): CharacterConditionalsController => {
  const t = TsUtils.wrappedFixedT(withContent).get(null, 'conditionals', 'Characters.JingliuB1.Content')
  const { basic, skill, ult, talent } = AbilityEidolon.ULT_TALENT_3_SKILL_BASIC_5
  const {
    SOURCE_BASIC,
    SOURCE_SKILL,
    SOURCE_ULT,
    SOURCE_TALENT,
    SOURCE_TECHNIQUE,
    SOURCE_TRACE,
    SOURCE_MEMO,
    SOURCE_E1,
    SOURCE_E2,
    SOURCE_E4,
    SOURCE_E6,
  } = Source.character('1212b1')

  const talentCrBuff = talent(e, 0.50, 0.52)

  const basicScaling = basic(e, 0.50, 0.55)
  const skillScaling = skill(e, 1.50, 1.65)
  const ultScaling = ult(e, 1.80, 1.98)

  const talentCdScaling = talent(e, 0.44, 0.484)

  const defaults = {
    talentEnhancedState: true,
    maxSyzygyDefPen: true,
    moonlightStacks: 5,
    e1Buffs: true,
    e2SkillDmgBuff: true,
    e4MoonlightCdBuff: true,
    e6ResPen: true,
  }

  const content: ContentDefinition<typeof defaults> = {
    talentEnhancedState: {
      id: 'talentEnhancedState',
      formItem: 'switch',
      text: t('talentEnhancedState.text'),
      content: t('talentEnhancedState.content', { UltCRBuff: TsUtils.precisionRound(100 * talentCrBuff) }),
    },
    maxSyzygyDefPen: {
      id: 'maxSyzygyDefPen',
      formItem: 'switch',
      text: t('maxSyzygyDefPen.text'),
      content: t('maxSyzygyDefPen.content', {}),
    },
    moonlightStacks: {
      id: 'moonlightStacks',
      formItem: 'slider',
      text: t('moonlightStacks.text'),
      content: t('moonlightStacks.content', { MoonlightCDBuff: TsUtils.precisionRound(100 * talentCdScaling) }),
      min: 0,
      max: 5,
    },
    e1Buffs: {
      id: 'e1Buffs',
      formItem: 'switch',
      text: t('e1Buffs.text'),
      content: t('e1Buffs.content', {}),
      disabled: e < 1,
    },
    e2SkillDmgBuff: {
      id: 'e2SkillDmgBuff',
      formItem: 'switch',
      text: t('e2SkillDmgBuff.text'),
      content: t('e2SkillDmgBuff.content', {}),
      disabled: e < 2,
    },
    e4MoonlightCdBuff: {
      id: 'e4MoonlightCdBuff',
      formItem: 'switch',
      text: t('e4MoonlightCdBuff.text'),
      content: t('e4MoonlightCdBuff.content', {}),
      disabled: e < 4,
    },
    e6ResPen: {
      id: 'e6ResPen',
      formItem: 'switch',
      text: t('e6ResPen.text'),
      content: t('e6ResPen.content', {}),
      disabled: e < 6,
    },
  }

  return {
    activeAbilities: [AbilityType.BASIC, AbilityType.SKILL, AbilityType.ULT],
    content: () => Object.values(content),
    defaults: () => defaults,
    precomputeEffects: (x: ComputedStatsArray, action: OptimizerAction, context: OptimizerContext) => {
      const r = action.characterConditionals as Conditionals<typeof content>

      // Skills
      x.CR.buff((r.talentEnhancedState) ? talentCrBuff : 0, SOURCE_TALENT)
      x.CD.buff(r.moonlightStacks * talentCdScaling, SOURCE_TALENT)
      x.CD.buff((e >= 4 && r.e4MoonlightCdBuff) ? r.moonlightStacks * 0.20 : 0, SOURCE_E4)

      // Traces
      x.RES.buff((r.talentEnhancedState) ? 0.35 : 0, SOURCE_TRACE)

      x.DEF_PEN.buff((r.maxSyzygyDefPen) ? 0.25 : 0, SOURCE_TRACE)
      buffAbilityDmg(x, ULT_DMG_TYPE, (r.talentEnhancedState) ? 0.20 : 0, SOURCE_TRACE)

      // Eidolons
      x.CD.buff((e >= 1 && r.e1Buffs) ? 0.36 : 0, SOURCE_E1)
      x.ICE_RES_PEN.buff((e >= 6 && r.e6ResPen) ? 0.30 : 0, SOURCE_E6)

      // Scaling
      x.BASIC_HP_SCALING.buff(basicScaling, SOURCE_BASIC)
      x.SKILL_HP_SCALING.buff(skillScaling, SOURCE_SKILL)
      x.SKILL_HP_SCALING.buff((e >= 1 && r.e1Buffs && r.talentEnhancedState) ? 0.80 : 0, SOURCE_SKILL)

      x.ULT_HP_SCALING.buff(ultScaling, SOURCE_ULT)
      x.ULT_HP_SCALING.buff((e >= 1 && r.e1Buffs) ? 0.80 : 0, SOURCE_ULT)

      // BOOST
      buffAbilityDmg(x, SKILL_DMG_TYPE, (e >= 2 && r.talentEnhancedState && r.e2SkillDmgBuff) ? 0.80 : 0, SOURCE_E2)

      x.BASIC_TOUGHNESS_DMG.buff(10, SOURCE_BASIC)
      x.SKILL_TOUGHNESS_DMG.buff(20, SOURCE_SKILL)
      x.ULT_TOUGHNESS_DMG.buff(20, SOURCE_ULT)

      return x
    },
    finalizeCalculations: (x: ComputedStatsArray) => {},
    gpuFinalizeCalculations: () => '',
  }
}
