import { pipeline } from '@huggingface/transformers';

let weights = {
  skills: 0.5,
  experiences: 0.25,
  summary: 0.05,
  title: 0.05,
  location: 0.1,
  headline: 0.05,
};

// Create a feature-extraction pipeline
let extractor = undefined;

async function loadExtractor() {
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
    dtype: 'fp32',
  });
}

function cosineSimilarity(vec1, vec2) {
  const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
  const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
  return dotProduct / (magnitude1 * magnitude2);
}

function preprocessCV(cv) {
  const skills = cv.skills
    .map((skill) => skill.value)
    .join(', ')
    .toLowerCase();
  const experiences = cv.experiences
    .map((exp) => exp.description)
    .join(' ')
    .toLowerCase();
  const summary = cv.summary;
  const location = cv.geoLocation;
  const title = cv.experiences.map((exp) => exp.title).join(', ');
  const headline = cv.headline;
  return { skills, experiences, summary, location, title, headline };
}

function preprocessOffer(offer) {
  const skills = offer.requiredSkills.join(', ').toLowerCase();
  const summary = offer.summary.toLowerCase();
  const location = offer.location;
  const title = offer.title;
  return { skills, summary, location, title };
}

const parseCv = (userCv) => {
  let newCv = {
    birthDate: userCv.Profile[0]['Birth Date'],
    experiences: userCv.Positions.map((position) => {
      return {
        companyName: position['Company Name'],
        description: position.Description,
        finishedOn: position['Finished On'],
        location: position.Location,
        startedOn: position['Started On'],
        title: position.Title,
      };
    }),
    firstName: userCv.Profile[0]['First Name'],
    geoLocation: userCv.Profile[0]['Geo Location'],
    headline: userCv.Profile[0].Headline,
    industry: userCv.Profile[0].Industry,
    instantMessengers: userCv.Profile[0]['Instant Messengers'],
    lastName: userCv.Profile[0]['Last Name'],
    skills: userCv.Skills.map((skill) => {
      return { value: skill.Name };
    }),
    summary: userCv.Profile[0].Summary,
    twitterHandles: userCv.Profile[0]['Twitter Handles'],
    websites: userCv.Profile[0].Websites,
    zipCode: userCv.Profile[0]['Zip Code'],
  };
  return newCv;
};

// Main similarity function
export async function computeSimilarity(userCv, offer) {
  // Preprocess inputs
  const cv = parseCv(userCv);
  const cvData = preprocessCV(cv);
  const offerData = preprocessOffer(offer);
  // console.log(cvData, offerData);

  // Prepare sentences for embedding
  const sentences = [
    cvData.skills,
    offerData.skills,
    cvData.experiences,
    offerData.summary,
    cvData.summary,
    offerData.summary,
    cvData.title,
    offerData.title,
    cvData.headline,
    offerData.title,
    cvData.location,
    offerData.location,
  ];

  // Compute embeddings in a batch
  if (!extractor) {
    await loadExtractor();
  }
  const output = await extractor(sentences, { pooling: 'mean', normalize: true });
  const embeddingDimensions = output.ort_tensor.dims[1];
  const numSentences = output.ort_tensor.dims[0]; // Number of sentences
  const embeddings = [];
  for (let i = 0; i < numSentences; i++) {
    embeddings.push(output.data.slice(i * embeddingDimensions, (i + 1) * embeddingDimensions));
  }

  // Compute field-wise similarities
  const skillSim = cosineSimilarity(embeddings[0], embeddings[1]);
  const experienceSim = cosineSimilarity(embeddings[2], embeddings[3]);
  const summarySim = cosineSimilarity(embeddings[4], embeddings[5]);
  const titleSim = cosineSimilarity(embeddings[6], embeddings[7]);
  const headlineSim = cosineSimilarity(embeddings[8], embeddings[9]);
  const locationSim = cosineSimilarity(embeddings[10], embeddings[11]);

  const overallSimilarity =
    skillSim * weights.skills +
    experienceSim * weights.experiences +
    summarySim * weights.summary +
    titleSim * weights.title +
    headlineSim * weights.headline +
    locationSim * weights.location;

  return {
    skillSim,
    experienceSim,
    summarySim,
    titleSim,
    headlineSim,
    locationSim,
    overallSimilarity,
  };
}
