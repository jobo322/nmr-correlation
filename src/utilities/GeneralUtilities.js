import lodash from 'lodash';

const getAtomCounts = (mf) => {
  const elements = mf ? mf.match(/[A-Z][a-z]{0,1}/g) : [];
  const counts = {};

  elements.forEach((elem) => {
    const regex = new RegExp(`(${elem}\\d+)`, 'g');
    const match = mf.match(regex);
    let count = 1;
    if (match) {
      count = Number(match[0].split(elem)[1]);
    }
    counts[elem] = count;
  });

  return counts;
};

const getLabel = (correlations, correlation) => {
  let label = Object.keys(correlation.getAttachments())
    .map((otherAtomType) =>
      correlation
        .getAttachments()
        // eslint-disable-next-line no-unexpected-multiline
        [otherAtomType].map((index) =>
          correlation.getLabel(correlations[index].getLabel('origin')),
        )
        .filter((_label) => _label),
    )
    .flat()
    .filter((_label, i, a) => a.indexOf(_label) === i)
    .sort((a, b) =>
      Number(a.split(/[a-z]+/i)[1]) - Number(b.split(/[a-z]+/i)[1]) < 0
        ? -1
        : Number(a.split(/[a-z]+/i)[1]) - Number(b.split(/[a-z]+/i)[1]) === 0 &&
          a.split(/\d+/)[1] < b.split(/\d+/)[1]
        ? -1
        : 1,
    )
    .join('/');

  if (label.length > 0) {
    return label;
  }

  return correlation.getLabel('origin');
};

const sortLabels = (labels) => {
  return labels.sort((a, b) =>
    Number(a.split(/[a-z]+/i)[1]) - Number(b.split(/[a-z]+/i)[1]) < 0
      ? -1
      : Number(a.split(/[a-z]+/i)[1]) - Number(b.split(/[a-z]+/i)[1]) === 0 &&
        a.split(/\d+/)[1] < b.split(/\d+/)[1]
      ? -1
      : 1,
  );
};

const getLabels = (correlations, correlation, experimentType) => {
  const labels = correlation
    .getLinks()
    .filter((link) => link.getExperimentType() === experimentType)
    .map((link) =>
      link
        .getMatches()
        .map((match) => {
          const matchingCorrelation = correlations[match];
          return getLabel(correlations, matchingCorrelation);
        })
        .flat(),
    )
    .flat()
    .filter((label, i, a) => label.length > 0 && a.indexOf(label) === i);

  return sortLabels(labels);
};

const checkSignalMatch = (signal1, signal2, tolerance) =>
  signal1.delta - tolerance <= signal2.delta &&
  signal2.delta <= signal1.delta + tolerance;

const letters = [...Array(26).keys()].map((i) => String.fromCharCode(i + 97));

const getLetter = (number) => {
  return letters[number];
};

const getCorrelationsByAtomType = (correlations, atomType) => {
  return correlations
    ? correlations.filter(
        (correlation) => correlation.getAtomType() === atomType,
      )
    : [];
};

const isEditedHSQC = (experiment) => {
  // detection whether experiment is an edited HSQC
  if (lodash.get(experiment, 'info.pulseSequence', '').includes('hsqced')) {
    return true;
  }

  return false;
};

const getCorrelationIndex = (correlations, correlation) => {
  return correlations.findIndex(
    (_correlation) => _correlation.getID() === correlation.getID(),
  );
};

const containsLink = (correlation, link) => {
  return correlation
    .getLinks()
    .some(
      (_link) =>
        _link.getExperimentType() === link.getExperimentType() &&
        _link.getExperimentID() === link.getExperimentID() &&
        lodash.isEqual(_link.getAtomType(), link.getAtomType()) &&
        _link.getSignalID() === link.getSignalID() &&
        _link.getAxis() === link.getAxis(),
    );
};

export {
  checkSignalMatch,
  containsLink,
  getAtomCounts,
  getCorrelationsByAtomType,
  getCorrelationIndex,
  getLabel,
  getLabels,
  getLetter,
  isEditedHSQC,
};
