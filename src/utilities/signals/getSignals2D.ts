import lodashCloneDeep from 'lodash/cloneDeep';
import lodashIsEqual from 'lodash/isEqual';

import { signalKindsToInclude } from '../../constants/signalKinds';
import { Spectrum2D } from '../../types';
import { Experiment2DSignal } from '../../types/experiment/experiment2DSignal';
import { Experiment2DSignals } from '../../types/experiment/experiment2DSignals';
import { ExperimentsType } from '../../types/experiment/experimentsType';
import { checkMatch } from '../general/checkMatch';
import { getAtomTypeFromNucleus } from '../general/getAtomTypeFromNucleus';
import { isEditedHSQC } from '../general/isEditedHSQC';

/**
 * Get all different 2D signals from experiments with allowed signal kinds in "signalKindsToInclude".
 *
 * @param {ExperimentsType} experiments1D
 */
export function getSignals2D(
  experiments2D: ExperimentsType,
): Experiment2DSignals {
  // store valid signals from 2D experiments
  const _signals2D: Experiment2DSignals = {};
  Object.keys(experiments2D).forEach((experimentType) => {
    const _signals: Array<Experiment2DSignal> = [];
    // for now we use the first occurring spectrum only, for each experiment type (current loop) and nuclei combination
    const indices: Array<number> = [];
    const nuclei: Array<Array<string>> = [];
    experiments2D[experimentType].forEach((_experiment, i) => {
      const experiment: Spectrum2D = _experiment as Spectrum2D;
      if (
        !nuclei.some((_nuclei) =>
          lodashIsEqual(_nuclei, experiment.info.nucleus),
        )
      ) {
        nuclei.push(experiment.info.nucleus);
        indices.push(i);
      }
    });
    indices.forEach((index) => {
      const spectrum2D: Spectrum2D = experiments2D[experimentType][
        index
      ] as Spectrum2D;
      const atomType = spectrum2D.info.nucleus.map((nucleus) =>
        getAtomTypeFromNucleus(nucleus),
      );
      const __signals = spectrum2D.zones.values
        .map((zone) =>
          zone.signal.filter((signal) =>
            signalKindsToInclude.includes(signal.kind),
          ),
        )
        .flat();
      __signals.forEach((signal) => {
        if (
          !_signals.some(
            (_signal) =>
              checkMatch(_signal.signal.x.delta, signal.x.delta, 0.0) &&
              checkMatch(_signal.signal.y.delta, signal.y.delta, 0.0),
          )
        ) {
          _signals.push({
            experimentType,
            experimentID: spectrum2D.id,
            atomType,
            // @TODO here we assume that only one peak exists for the signal and its intensity indicates the sign
            signal: {
              ...lodashCloneDeep(signal),
              sign: isEditedHSQC(spectrum2D)
                ? signal.peak[0].z >= 0
                  ? 1
                  : -1
                : 0,
            },
          });
        }
      });
    });

    _signals2D[experimentType] = _signals;
  });

  return _signals2D;
}
