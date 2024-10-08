import { ContentItem } from 'types/Conditionals'
import { SuperImpositionLevel } from 'types/LightCone'
import { Form } from 'types/Form'
import { LightConeConditional } from 'types/LightConeConditionals'
import getContentFromLCRanks from '../getContentFromLCRank'
import { buffAbilityDmg } from 'lib/optimizer/calculateBuffs'
import { ComputedStatsObject, ULT_TYPE } from 'lib/conditionals/conditionalConstants'

export default (s: SuperImpositionLevel): LightConeConditional => {
  const sValues = [0.32, 0.40, 0.48, 0.56, 0.64]
  const lcRanks = {
    id: '21013',
    skill: 'The Power of Sound',
    desc: 'The wearer regenerates #2[i] Energy immediately upon entering battle, and increases Ultimate DMG by #1[i]%.',
    params: [
      [0.32, 20],
      [0.4, 23],
      [0.48, 26],
      [0.56, 29],
      [0.64, 32],
    ],
    properties: [
      [], [], [], [], [],
    ],
  }

  const content: ContentItem[] = [{
    lc: true,
    id: 'ultDmgBuff',
    name: 'ultDmgBuff',
    formItem: 'switch',
    text: 'Ult DMG buff',
    title: lcRanks.skill,
    content: getContentFromLCRanks(s, lcRanks),
  }]

  return {
    content: () => content,
    defaults: () => ({
      ultDmgBuff: true,
    }),
    precomputeEffects: (x: ComputedStatsObject, request: Form) => {
      const r = request.lightConeConditionals

      buffAbilityDmg(x, ULT_TYPE, sValues[s], (r.ultDmgBuff))
    },
    finalizeCalculations: () => {
    },
  }
}
