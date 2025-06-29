import { DOT_DMG_TYPE } from 'lib/conditionals/conditionalConstants'
import {
  Conditionals,
  ContentDefinition,
} from 'lib/conditionals/conditionalUtils'
import { Source } from 'lib/optimization/buffSource'
import { buffAbilityDefPen } from 'lib/optimization/calculateBuffs'
import { ComputedStatsArray } from 'lib/optimization/computedStatsArray'
import { TsUtils } from 'lib/utils/TsUtils'
import { LightConeConditionalsController } from 'types/conditionals'
import { SuperImpositionLevel } from 'types/lightCone'
import {
  OptimizerAction,
  OptimizerContext,
} from 'types/optimizer'

export default (s: SuperImpositionLevel, withContent: boolean): LightConeConditionalsController => {
  const t = TsUtils.wrappedFixedT(withContent).get(null, 'conditionals', 'Lightcones.ReforgedRemembrance')
  const { SOURCE_LC } = Source.lightCone('23022')

  const sValuesAtk = [0.05, 0.06, 0.07, 0.08, 0.09]
  const sValuesDotPen = [0.072, 0.079, 0.086, 0.093, 0.10]

  const defaults = {
    prophetStacks: 4,
  }

  const content: ContentDefinition<typeof defaults> = {
    prophetStacks: {
      lc: true,
      id: 'prophetStacks',
      formItem: 'slider',
      text: t('Content.prophetStacks.text'),
      content: t('Content.prophetStacks.content', {
        AtkBuff: TsUtils.precisionRound(100 * sValuesAtk[s]),
        DefIgnore: TsUtils.precisionRound(100 * sValuesDotPen[s]),
      }),
      min: 0,
      max: 4,
    },
  }

  return {
    content: () => Object.values(content),
    defaults: () => defaults,
    precomputeEffects: (x: ComputedStatsArray, action: OptimizerAction, context: OptimizerContext) => {
      const r = action.lightConeConditionals as Conditionals<typeof content>

      x.ATK_P.buff(r.prophetStacks * sValuesAtk[s], SOURCE_LC)

      buffAbilityDefPen(x, DOT_DMG_TYPE, r.prophetStacks * sValuesDotPen[s], SOURCE_LC)
    },
    finalizeCalculations: () => {
    },
  }
}
