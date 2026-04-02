import { Question, Book, Chapter, Topic } from '../types';

export const sampleBooks: Partial<Book>[] = [
  { title: 'Oxford Handbook of Clinical Medicine', examType: 'FCPS 1' },
  { title: 'Bailey & Love\'s Short Practice of Surgery', examType: 'FCPS 2' },
  { title: 'Davidson\'s Principles and Practice of Medicine', examType: 'IMM' }
];

export const sampleQuestions: Partial<Question>[] = [
  {
    text: "Regarding albumin, the following statements are true EXCEPT which one?",
    options: [
      "Albumin is a negative acute phase protein",
      "A common cause of hypoalbuminaemia is starvation or malnutrition",
      "In health the liver produces approximately 10 g per day of albumin",
      "The circulation half-life of albumin is approximately 18 days",
      "The majority of total body albumin is found in the extravascular compartment"
    ],
    correctAnswerIndex: 1,
    explanation: "Albumin is a single polypeptide of 585 amino acids and molecular weight 66kDa produced by the liver. It is correct that albumin is not stored in the liver so levels do reflect synthetic activity but during starvation with normal liver function, albumin will be maintained at the expense of proteolysis elsewhere. Albumin is not catabolised during starvation.",
    book: "Paper A",
    topic: "Physiology",
    type: "text"
  },
  {
    text: "Which of the following statements regarding sugammadex is TRUE?",
    options: [
      "It is a modified α-cyclodextrin",
      "The drug forms complexes with steroidal neuromuscular blocking drugs with a ratio of 1:2",
      "Following sugammadex administration to reverse rocuronium-induced neuromuscular blockade the measured total plasma rocuronium concentration will rise",
      "The majority of the drug is metabolised and excreted by the kidneys",
      "Sugammadex exerts its effect by binding with rocuronium at the neuromuscular junction"
    ],
    correctAnswerIndex: 2,
    explanation: "Sugammadex forms tight 1:1 complexes with steroidal neuromuscular blocking drugs in plasma, resulting in movement of neuromuscular blocker away from the neuromuscular junction into the plasma down a concentration gradient. This causes the measured total plasma rocuronium concentration to rise.",
    book: "Paper A",
    topic: "Pharmacology",
    type: "text"
  },
  {
    text: "Pulmonary vasoconstriction may be caused by",
    options: [
      "Hypothermia",
      "Smoking ‘Crack’ cocaine",
      "Volatile anaesthetic agents",
      "Calcium channel blockers",
      "Positive end expiratory pressure"
    ],
    correctAnswerIndex: 1,
    explanation: "There is a substantial body of case reports and good animal-model work to suggest that smoking ‘Crack’ puts a patient at risk of developing pulmonary vasoconstriction. All the other options here are known to inhibit pulmonary vasoconstriction.",
    book: "Paper A",
    topic: "Physiology",
    type: "text"
  },
  {
    text: "Regarding central neuraxial blocks, which one of the following is MOST likely to cause permanent neurological injury?",
    options: [
      "An epidural sited for obstetric indications",
      "An epidural sited for adult general surgical indications",
      "An epidural sited for paediatric general surgical indications",
      "A spinal sited rather than an epidural",
      "An epidural sited for chronic pain indications"
    ],
    correctAnswerIndex: 1,
    explanation: "The NAP3 study showed that epidurals caused more harm than spinals and the highest risk group for epidurals was in adult general peri-operative care.",
    book: "Paper A",
    topic: "Clinical Anaesthesia",
    type: "text"
  },
  {
    text: "A nasogastric tube is sited in a patient ventilated on the critical care unit. Which one of the following is considered the MOST ACCURATE way of confirming correct positioning?",
    options: [
      "Measurement of the aspirate using pH indicator strips",
      "Auscultation of air insufflated through the nasogastric tube (the ‘whoosh’ test)",
      "Testing the acidity/alkalinity of aspirate from the nasogastric tube using litmus paper",
      "Observing the appearance of the aspirate from the nasogastric tube",
      "Chest radiograph"
    ],
    correctAnswerIndex: 4,
    explanation: "The most accurate method for confirming correct tube placement is accurately reported chest radiography. pH testing is also recommended but radiography remains the gold standard.",
    book: "Paper A",
    topic: "Critical Care",
    type: "text"
  },
  {
    text: "Which of the following patient groups is NOT thought to be at increased risk of infective endocarditis and therefore does NOT require prophylaxis against infective endocarditis when undergoing an interventional procedure?",
    options: [
      "Moderate mitral regurgitation",
      "A patient with a history of previous endocarditis but a structurally normal heart",
      "Isolated atrial septal defect",
      "Hypertrophic cardiomyopathy",
      "Pulmonary stenosis"
    ],
    correctAnswerIndex: 2,
    explanation: "In 2008, NICE produced new guidelines stating that prophylaxis against IE should not, routinely, be offered to people undergoing dental or non-dental procedures, except for specific high-risk groups. Isolated atrial septal defects are excluded from the high-risk category.",
    book: "Paper A",
    topic: "Clinical Anaesthesia",
    type: "text"
  },
  {
    text: "A 40-year-old woman known to have myasthenia gravis presents to the emergency department with severe global weakness. In order to distinguish between an excess or inadequacy of her myasthenia treatment, which one of the following features is likely to be the MOST HELPFUL?",
    options: [
      "Rapid onset of ventilatory failure",
      "Response to dose of cholinesterase inhibitor",
      "Flaccid muscle paralysis",
      "Presence of bronchospasm",
      "Loss of deep tendon reflexes"
    ],
    correctAnswerIndex: 1,
    explanation: "Distinguishing myasthenic crisis from cholinergic crisis is difficult. They are differentiated by administration of intravenous edrophonium (a short-acting cholinesterase inhibitor). Myasthenic crisis will show transient improvement.",
    book: "Paper A",
    topic: "Clinical Anaesthesia",
    type: "text"
  },
  {
    text: "Which of the following is NOT a recognised cause of the toxic effects of tricyclic antidepressant drugs taken in overdose?",
    options: [
      "Inhibition of noradrenaline reuptake at nerve terminals",
      "A myocardial membrane stabilising effect",
      "An anticholinergic action",
      "Indirect activation of GABAA receptors",
      "Direct alpha adrenergic action"
    ],
    correctAnswerIndex: 3,
    explanation: "Toxic effects of TCAs are mediated via direct alpha adrenergic blockade, anticholinergic action, myocardial membrane stabilising effect, and inhibition of noradrenaline reuptake. Indirect activation of GABAA receptors is not a recognised mechanism of TCA toxicity.",
    book: "Paper A",
    topic: "Pharmacology",
    type: "text"
  },
  {
    text: "Regarding the use of tourniquets in the theatre environment, the following statements are true EXCEPT which one?",
    options: [
      "Exsanguination and tourniquet inflation is associated with immediate rise in CVP, ABP and heart rate",
      "After two hours’ inflation time, a significant decrease in core temperature can be expected on deflation",
      "Pre-inflation, ketamine 0.25 mg/kg intravenously can prevent the hypertensive response",
      "When using a double-cuff tourniquet for IVRA the proximal cuff is the first to be used",
      "If the continuous tourniquet inflation time exceeds two hours, the ischaemic cell damage and lesions associated with acidosis are irreversible"
    ],
    correctAnswerIndex: 4,
    explanation: "An arbitrary inflation duration limit of two hours is often applied, but at two hours' duration, cell lesions secondary to local acidosis are still reversible.",
    book: "Paper A",
    topic: "Clinical Anaesthesia",
    type: "text"
  },
  {
    text: "You are called to the resuscitation room to take a venous blood sample. Select the sample that you would draw and fill THIRD.",
    options: [
      "Standard gold-topped sample bottle (SST)",
      "Standard grey-topped sample bottle (fluoride oxalate)",
      "Standard blue-topped sample bottle (citrate)",
      "Standard purple-topped sample bottle (EDTA)",
      "Blood culture bottles"
    ],
    correctAnswerIndex: 0,
    explanation: "The recommended order of draw is: 1. Blood culture, 2. Citrate (blue), 3. SST (gold), 4. EDTA (purple), 5. Oxalate (grey). SST is filled third.",
    book: "Paper A",
    topic: "Clinical Practice",
    type: "text"
  }
];
