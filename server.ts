import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data", "db.json");

app.use(express.json());

// Initialize Lazy Gemini Client
let aiInstance: any = null;
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing. Please add it to the Secrets panel in AI Studio.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// Initial Seed Data
const initialQuestions = [
  {
    id: "q-dbms-acid",
    title: "ACID Properties in DBMS",
    subject: "Database Systems",
    questionText: "Explain the ACID properties of database transactions and describe why durability is crucial for financial systems.",
    modelAnswer: "ACID properties stand for Atomicity, Consistency, Isolation, and Durability. Atomicity ensures all operations in a transaction succeed or fail as a single unit (all-or-nothing). Consistency guarantees that a transaction transitions the database from one valid state to another, maintaining all schema integrity constraints and invariants. Isolation ensures concurrent transactions execute without interference, as if they were serial, preventing dirty reads or concurrency anomalies. Durability guarantees that once a transaction commits, its changes survive system crashes by writing to non-volatile storage (disk logging). Durability is critical in financial systems to prevent loss of funds, account balance discrepancies, or missing transaction records in the event of sudden power failures or server crashes.",
    rubricCriteria: [
      "Explain Atomicity (All-or-nothing execution)",
      "Explain Consistency (Valid state transitions & integrity rules)",
      "Explain Isolation (Concurrency without interference/serializability)",
      "Explain Durability (Crash survival via persistent storage)",
      "Justify why Durability is crucial for financial systems (No data/fund loss)"
    ],
    maxPoints: 10,
    instructionalStrategy: "Focus on Isolation levels (Read Committed vs. Serializable) in the next laboratory session, as several students confused Isolation with consistency checks.",
    strategyUpdatedAt: "2026-07-05T12:00:00Z"
  },
  {
    id: "q-bio-central-dogma",
    title: "Central Dogma of Molecular Biology",
    subject: "Biology",
    questionText: "Describe the Central Dogma of Molecular Biology, detailing the two major processes involved, the enzymes responsible, and the direction of genetic information flow.",
    modelAnswer: "The Central Dogma of Molecular Biology describes the flow of genetic information: DNA to RNA to Protein. The first process is Transcription, where the genetic sequence in DNA is copied into messenger RNA (mRNA) by the enzyme RNA Polymerase. This flows from DNA to RNA in the nucleus. The second process is Translation, where ribosomes decode mRNA to synthesize proteins, with transfer RNA (tRNA) bringing amino acids to form a polypeptide chain. This flows from RNA to Protein in the cytoplasm. Information flow is unidirectional under standard conditions, though reverse transcription (RNA to DNA via Reverse Transcriptase) can occur in retroviruses.",
    rubricCriteria: [
      "State the primary flow of genetic information: DNA -> RNA -> Protein",
      "Describe Transcription and identify RNA Polymerase as the main enzyme",
      "Describe Translation and mention Ribosomes/tRNA in the cytoplasm",
      "Explain cellular locations (nucleus for transcription, cytoplasm for translation)",
      "Mention directionality and reverse transcription as a notable exception"
    ],
    maxPoints: 10,
    instructionalStrategy: "Organize a hands-on modeling workshop mapping codon-to-anticodon pairs because 30% of students struggled to explain tRNA's specific role in translation.",
    strategyUpdatedAt: "2026-07-05T15:30:00Z"
  },
  {
    id: "q-phys-newton3",
    title: "Newton's Third Law of Motion",
    subject: "Physics",
    questionText: "State Newton's Third Law of Motion. Discuss how a rocket achieves lift-off using this law, and address the misconception that action and reaction forces cancel each other out.",
    modelAnswer: "Newton's Third Law states that for every action, there is an equal and opposite reaction. This means forces always occur in matched action-reaction pairs, acting on different bodies. A rocket achieves lift-off by expelling high-velocity exhaust gases downwards through its engine nozzle (action). The reaction force pushes the rocket upwards with equal force (reaction). The misconception that action and reaction forces cancel each other out is false because action and reaction forces act on two entirely different objects. Cancellation only occurs if equal and opposite forces act on the same object. Since the action force is on the exhaust gas and the reaction force is on the rocket, both objects experience net acceleration.",
    rubricCriteria: [
      "State 'for every action there is an equal and opposite reaction'",
      "Identify that forces always act on different bodies",
      "Explain the action force (exhaust gases expelled downwards)",
      "Explain the reaction force (rocket pushed upwards with equal force)",
      "Refute the cancelation misconception (forces act on different objects, hence net acceleration)"
    ],
    maxPoints: 10,
    instructionalStrategy: "Use free-body diagram exercises to emphasize the system boundaries and the objects forces act on.",
    strategyUpdatedAt: "2026-07-06T08:00:00Z"
  }
];

const initialSubmissions = [
  {
    id: "s-1",
    questionId: "q-dbms-acid",
    studentName: "Alex Mercer",
    studentRoll: "CS2026-001",
    answerText: "ACID properties are Atomicity, Consistency, Isolation, and Durability. Atomicity means a transaction is all or nothing - either all of it happens or none of it does. Consistency means the database remains consistent before and after the transaction. Isolation means transactions don't mess with each other when running at the same time. Durability means that once a transaction is done, it is saved on disk and won't be lost even if there's a power failure. This is very important for banks because if a server crashes right after you deposit money, the bank needs to make sure the money is still there and hasn't just disappeared.",
    submittedAt: "2026-07-05T10:00:00Z",
    evaluation: {
      score: 9.5,
      semanticSimilarityScore: 92,
      conceptCoverage: [
        { concept: "Explain Atomicity (All-or-nothing execution)", score: 100, feedback: "Excellent explanation of all-or-nothing property." },
        { concept: "Explain Consistency (Valid state transitions & integrity rules)", score: 80, feedback: "Good, but could define consistency more rigorously in terms of database invariants." },
        { concept: "Explain Isolation (Concurrency without interference/serializability)", score: 90, feedback: "Clear explanation of non-interference during concurrency." },
        { concept: "Explain Durability (Crash survival via persistent storage)", score: 100, feedback: "Correctly mentions saving on disk to prevent loss on power failure." },
        { concept: "Justify why Durability is crucial for financial systems (No data/fund loss)", score: 100, feedback: "Perfect practical banking example used." }
      ],
      strengths: ["Very clear definitions of all four properties", "Strong practical real-world justification for durability in banking context"],
      weaknesses: ["Could define consistency more rigorously in terms of database invariants and schema rules"],
      constructiveFeedback: "Excellent work! Your explanation is highly intuitive, concise, and technically accurate. To elevate your answer, remember to define Consistency as maintaining database constraints and transitioning between valid states rather than just 'remaining consistent'.",
      grammarScore: 96,
      evaluatedBy: "Gemini 3.5-Flash",
      evaluatedAt: "2026-07-05T10:05:00Z"
    }
  },
  {
    id: "s-2",
    questionId: "q-dbms-acid",
    studentName: "Sarah Jenkins",
    studentRoll: "CS2026-002",
    answerText: "ACID is Atomicity, Consistency, and Durability. Atomicity is about doing the operations. Consistency means the data makes sense. Isolation means it is isolated. Durability is storing it. Durability is important in finance because you don't want to lose records.",
    submittedAt: "2026-07-05T11:15:00Z",
    evaluation: {
      score: 4.5,
      semanticSimilarityScore: 48,
      conceptCoverage: [
        { concept: "Explain Atomicity (All-or-nothing execution)", score: 50, feedback: "Extremely vague; does not mention the crucial all-or-nothing nature of transactions." },
        { concept: "Explain Consistency (Valid state transitions & integrity rules)", score: 50, feedback: "Vague; 'makes sense' is too informal and lacks technical DBMS definition." },
        { concept: "Explain Isolation (Concurrency without interference/serializability)", score: 20, feedback: "Tautological. Simply says 'it is isolated' without explaining concurrency, multiple users, or non-interference." },
        { concept: "Explain Durability (Crash survival via persistent storage)", score: 60, feedback: "Correctly mentions storing, but lacks mention of persistent storage, logs, or crash survival." },
        { concept: "Justify why Durability is crucial for financial systems (No data/fund loss)", score: 50, feedback: "Briefly states 'don't want to lose records' but lacks depth or practical illustration." }
      ],
      strengths: ["Recognizes the acronym components", "States the basic intent of database persistence"],
      weaknesses: ["Definitions are tautological or extremely brief", "Lacks key technical terms (concurrency, transaction, non-volatile, commit, roll-back)", "Very low technical depth"],
      constructiveFeedback: "Your response is too brief and lacks technical rigor. Please avoid using the term itself to define it (e.g., 'isolation means isolated'). You need to explain *how* these properties function—for example, explaining that Atomicity is 'all-or-nothing' and Isolation ensures concurrent transactions don't interfere. Review the textbook chapter on transaction management.",
      grammarScore: 82,
      evaluatedBy: "Gemini 3.5-Flash",
      evaluatedAt: "2026-07-05T11:20:00Z"
    }
  },
  {
    id: "s-3",
    questionId: "q-bio-central-dogma",
    studentName: "Liam O'Connor",
    studentRoll: "CS2026-005",
    answerText: "The Central Dogma states that genetic information flows from DNA to RNA and then to Protein. Transcription happens in the nucleus and makes RNA from DNA, using RNA polymerase. Translation occurs in the cytoplasm on the ribosomes, turning RNA into proteins. Sometimes retroviruses do reverse transcription, which is RNA to DNA.",
    submittedAt: "2026-07-05T14:10:00Z",
    evaluation: {
      score: 9.0,
      semanticSimilarityScore: 90,
      conceptCoverage: [
        { concept: "State the primary flow of genetic information: DNA -> RNA -> Protein", score: 100, feedback: "Perfect statement of the standard flow of information." },
        { concept: "Describe Transcription and identify RNA Polymerase as the main enzyme", score: 100, feedback: "Correctly describes DNA to RNA transcription using RNA Polymerase." },
        { concept: "Describe Translation and mention Ribosomes/tRNA in the cytoplasm", score: 80, feedback: "Mentions translation on ribosomes, but missed the specific mention of tRNA's role in bringing amino acids." },
        { concept: "Explain cellular locations (nucleus for transcription, cytoplasm for translation)", score: 100, feedback: "Accurate locations provided (nucleus for transcription, cytoplasm for translation)." },
        { concept: "Mention directionality and reverse transcription as a notable exception", score: 100, feedback: "Correctly references retroviruses doing reverse transcription (RNA to DNA)." }
      ],
      strengths: ["Highly structured and accurate", "Good inclusion of the reverse transcription exception"],
      weaknesses: ["Missed mentioning transfer RNA (tRNA) as the vehicle that carries amino acids during translation"],
      constructiveFeedback: "Outstanding job! Your explanation is accurate, clear, and demonstrates a solid understanding of both the standard flow and exceptions (retroviruses). To achieve a perfect score, be sure to mention the role of transfer RNA (tRNA) in translation, which acts as the physical link between mRNA codons and amino acids.",
      grammarScore: 94,
      evaluatedBy: "Gemini 3.5-Flash",
      evaluatedAt: "2026-07-05T14:15:00Z"
    }
  },
  {
    id: "s-4",
    questionId: "q-bio-central-dogma",
    studentName: "Chloe Zhang",
    studentRoll: "CS2026-006",
    answerText: "The central dogma is about DNA, RNA and Proteins. DNA is transcribed into RNA which is then translated into Proteins. Transcription is done by RNA polymerase in the nucleus. Translation is in the cytoplasm.",
    submittedAt: "2026-07-05T14:40:00Z",
    evaluation: {
      score: 7.0,
      semanticSimilarityScore: 78,
      conceptCoverage: [
        { concept: "State the primary flow of genetic information: DNA -> RNA -> Protein", score: 100, feedback: "Correctly states flow: DNA to RNA to Proteins." },
        { concept: "Describe Transcription and identify RNA Polymerase as the main enzyme", score: 90, feedback: "Good, mentions transcription by RNA Polymerase." },
        { concept: "Describe Translation and mention Ribosomes/tRNA in the cytoplasm", score: 40, feedback: "Incomplete description of translation. Mentions it is in the cytoplasm but fails to mention ribosomes or tRNA." },
        { concept: "Explain cellular locations (nucleus for transcription, cytoplasm for translation)", score: 100, feedback: "Correctly places transcription in the nucleus and translation in the cytoplasm." },
        { concept: "Mention directionality and reverse transcription as a notable exception", score: 0, feedback: "Completely omitted any mention of the directionality constraints or the reverse transcription exception." }
      ],
      strengths: ["Provides the core sequence correctly", "Accurately identifies transcription location and enzyme"],
      weaknesses: ["Omitted any discussion of ribosomes or tRNA in translation", "Completely missed the reverse transcription exception"],
      constructiveFeedback: "A good, basic summary of the central dogma. However, it lacks detail on Translation—please remember to explain the roles of Ribosomes and tRNA in reading codons and assembling amino acids. Additionally, mentioning reverse transcription (RNA to DNA in retroviruses) is crucial to showing a comprehensive understanding.",
      grammarScore: 90,
      evaluatedBy: "Gemini 3.5-Flash",
      evaluatedAt: "2026-07-05T14:45:00Z"
    }
  },
  {
    id: "s-5",
    questionId: "q-phys-newton3",
    studentName: "Emma Watson",
    studentRoll: "CS2026-009",
    answerText: "Newton's Third Law says for every action there is an equal and opposite reaction. When a rocket goes up, it shoots fire down, which pushes the rocket up. The action is fire going down, and the reaction is the rocket going up. Action and reaction forces don't cancel because they are on different objects. Fire is one object and rocket is the other, so they accelerate.",
    submittedAt: "2026-07-06T07:30:00Z",
    evaluation: {
      score: 8.5,
      semanticSimilarityScore: 86,
      conceptCoverage: [
        { concept: "State 'for every action there is an equal and opposite reaction'", score: 100, feedback: "Correctly stated the law." },
        { concept: "Identify that forces always act on different bodies", score: 90, feedback: "Correctly notes forces act on different objects." },
        { concept: "Explain the action force (exhaust gases expelled downwards)", score: 80, feedback: "Explains action as 'fire going down' which is a bit informal; should use 'gases expelled'." },
        { concept: "Explain the reaction force (rocket pushed upwards with equal force)", score: 90, feedback: "Good, correctly links rocket going up as the reaction." },
        { concept: "Refute the cancelation misconception (forces act on different objects, hence net acceleration)", score: 90, feedback: "Good refutation of cancellation based on forces acting on different bodies." }
      ],
      strengths: ["Excellent intuitive understanding of why action/reaction forces do not cancel out", "Good explanation of rocket forces in simple terms"],
      weaknesses: ["A bit informal in scientific terminology (using 'fire' instead of 'high-velocity exhaust gases' or 'fuel combustion products')"],
      constructiveFeedback: "Great work! You have a solid conceptual grasp of this physical law, particularly why the forces do not cancel out. To make this answer more professional and scientifically precise, use terms like 'expulsion of high-velocity exhaust gases' instead of 'shoots fire', and explain that the equal reaction force pushes the rocket upward.",
      grammarScore: 91,
      evaluatedBy: "Gemini 3.5-Flash",
      evaluatedAt: "2026-07-06T07:35:00Z"
    }
  },
  {
    id: "s-6",
    questionId: "q-phys-newton3",
    studentName: "James Miller",
    studentRoll: "CS2026-003",
    answerText: "Newton's Third Law states that every action has an equal and opposite reaction. But they cancel each other out, right? Because if action is equal and opposite to reaction, then they are +F and -F, so net force is 0. That's why a rocket has to burn a lot of fuel to overcome this and push through the air. The action is the engine pushing on the ground, and the reaction is the ground pushing back.",
    submittedAt: "2026-07-06T08:10:00Z",
    evaluation: {
      score: 3.0,
      semanticSimilarityScore: 35,
      conceptCoverage: [
        { concept: "State 'for every action there is an equal and opposite reaction'", score: 100, feedback: "Correctly stated the law text." },
        { concept: "Identify that forces always act on different bodies", score: 0, feedback: "Fails completely to state that forces act on different bodies, leading directly to the cancellation misconception." },
        { concept: "Explain the action force (exhaust gases expelled downwards)", score: 30, feedback: "Incorrect action. Assumes engine pushes on the ground, which is a major misconception (rockets fly in space with no ground)." },
        { concept: "Explain the reaction force (rocket pushed upwards with equal force)", score: 40, feedback: "Vague reaction; thinks the ground pushes the rocket." },
        { concept: "Refute the cancelation misconception (forces act on different objects, hence net acceleration)", score: 0, feedback: "Fails to refute the misconception. Instead, the student reinforces and agrees with the misconception, stating forces *do* cancel out." }
      ],
      strengths: ["Accurately recalls the literal phrasing of Newton's Third Law"],
      weaknesses: ["Harbors the exact misconception the question asked to refute", "Believes rocket action/reaction forces cancel out", "Incorrectly believes rockets push against the ground to lift off", "Severe conceptual gaps in force application boundaries"],
      constructiveFeedback: "You have a severe misconception regarding force interaction. Action and reaction forces NEVER cancel out because they act on DIFFERENT objects. In a rocket, the action is the engine pushing the *gas* down, and the reaction is the *gas* pushing the rocket up. The rocket does NOT push against the ground (it can fly in the vacuum of space!). Please re-read the section on force pairs and system boundaries.",
      grammarScore: 88,
      evaluatedBy: "Gemini 3.5-Flash",
      evaluatedAt: "2026-07-06T08:15:00Z"
    }
  },
  {
    id: "s-7",
    questionId: "q-dbms-acid",
    studentName: "Rohan Gupta",
    studentRoll: "CS2026-012",
    answerText: "ACID properties ensure database reliability. Atomicity means a transaction is treated as a single unit, so either all operations commit or none do. Consistency means the database must start and end in a consistent state, keeping integrity constraints like keys valid. Isolation means that if two transactions run at the same time, they do not interfere. They run as if they are serial. Durability means that once a transaction completes, its changes are written to persistent storage (like HDD or SSD logs) so they are safe from crashes. In financial apps, if a server loses power during a fund transfer, durability ensures the bank doesn't lose the record of the transaction.",
    submittedAt: "2026-07-06T07:10:00Z"
    // This one is UNGRADED! Let's let the user experience grading it!
  }
];

// Database helpers
async function ensureDb() {
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    try {
      await fs.access(DB_PATH);
    } catch {
      // Create with seed data
      await fs.writeFile(DB_PATH, JSON.stringify({ questions: initialQuestions, submissions: initialSubmissions }, null, 2));
    }
  } catch (err) {
    console.error("Error ensuring DB file", err);
  }
}

async function readDb() {
  await ensureDb();
  const data = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(data);
}

async function writeDb(data: any) {
  await ensureDb();
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

// REST Endpoints
app.get("/api/questions", async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.questions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/questions", async (req, res) => {
  try {
    const { title, subject, questionText, modelAnswer, rubricCriteria, maxPoints } = req.body;
    if (!title || !subject || !questionText || !modelAnswer || !rubricCriteria || !maxPoints) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const db = await readDb();
    const newQuestion = {
      id: "q-" + Date.now(),
      title,
      subject,
      questionText,
      modelAnswer,
      rubricCriteria: Array.isArray(rubricCriteria) ? rubricCriteria : [rubricCriteria],
      maxPoints: Number(maxPoints),
      instructionalStrategy: "",
      strategyUpdatedAt: ""
    };
    db.questions.push(newQuestion);
    await writeDb(db);
    res.status(201).json(newQuestion);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/submissions", async (req, res) => {
  try {
    const db = await readDb();
    res.json(db.submissions);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/submissions", async (req, res) => {
  try {
    const { questionId, studentName, studentRoll, answerText } = req.body;
    if (!questionId || !studentName || !studentRoll || !answerText) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const db = await readDb();
    const newSubmission = {
      id: "s-" + Date.now(),
      questionId,
      studentName,
      studentRoll,
      answerText,
      submittedAt: new Date().toISOString()
    };
    db.submissions.push(newSubmission);
    await writeDb(db);
    res.status(201).json(newSubmission);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Real-Time Evaluation using Gemini 3.5-flash
app.post("/api/submissions/:id/evaluate", async (req, res) => {
  try {
    const submissionId = req.params.id;
    const db = await readDb();
    const subIdx = db.submissions.findIndex((s: any) => s.id === submissionId);
    if (subIdx === -1) {
      return res.status(404).json({ error: "Submission not found" });
    }
    const submission = db.submissions[subIdx];
    const question = db.questions.find((q: any) => q.id === submission.questionId);
    if (!question) {
      return res.status(404).json({ error: "Associated question not found" });
    }

    const ai = getGeminiClient();

    // Prepare prompt
    const prompt = `
You are an expert academic evaluator. Your task is to perform a rigorous semantic evaluation of a student's answer against a given model answer and specific rubric criteria.

--- QUESTION INFORMATION ---
Title: ${question.title}
Subject: ${question.subject}
Question: ${question.questionText}
Max Points: ${question.maxPoints}

--- MODEL ANSWER ---
${question.modelAnswer}

--- EVALUATION RUBRIC CRITERIA ---
${question.rubricCriteria.map((c: string, index: number) => `${index + 1}. ${c}`).join("\n")}

--- STUDENT RESPONSE ---
${submission.answerText}

Instructions:
1. Conduct a deep NLP and semantic analysis. Evaluate if the student represents the same semantic concepts as the model answer, even if phrased differently.
2. Determine a score (0 to ${question.maxPoints}). Be academically rigorous but fair. If the answer is completely correct and has excellent coverage, give it full marks.
3. Determine a 'semanticSimilarityScore' (percentage between 0 and 100) representing how well the overall semantic concepts, content density, and technical arguments in the student's response overlap with the model answer.
4. Go through each rubric criteria and assign a score (0 to 100) for how well they met that specific point, along with clear and helpful critique feedback for that item.
5. Extract key 'strengths' and 'weaknesses'.
6. Write a supportive, highly constructive and coaching-focused 'constructiveFeedback' text (markdown format is acceptable). Be encouraging yet clear about missing technical points.
7. Score the student's grammar, technical writing clarity, and spelling under 'grammarScore' (0 to 100).

You must return a response in JSON format matching the schema requested.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: `Score for this submission between 0 and ${question.maxPoints}` },
            semanticSimilarityScore: { type: Type.INTEGER, description: "Overall semantic similarity percent with model answer (0 to 100)" },
            conceptCoverage: {
              type: Type.ARRAY,
              description: "Evaluation for each of the rubric criteria points provided",
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING, description: "The rubric criteria text verbatim" },
                  score: { type: Type.INTEGER, description: "Score out of 100 for this concept" },
                  feedback: { type: Type.STRING, description: "Detailed critique for this specific criterion" }
                },
                required: ["concept", "score", "feedback"]
              }
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of positive aspects in the student response" },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key areas lacking or incorrect" },
            constructiveFeedback: { type: Type.STRING, description: "Comprehensive coaching feedback addressing the student directly" },
            grammarScore: { type: Type.INTEGER, description: "Grammar, terminology precision, spelling and legibility score out of 100" }
          },
          required: ["score", "semanticSimilarityScore", "conceptCoverage", "strengths", "weaknesses", "constructiveFeedback", "grammarScore"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini.");
    }

    const evaluation = JSON.parse(resultText.trim());
    evaluation.evaluatedBy = "Gemini 3.5-Flash";
    evaluation.evaluatedAt = new Date().toISOString();

    db.submissions[subIdx].evaluation = evaluation;
    await writeDb(db);

    res.json(evaluation);
  } catch (err: any) {
    console.error("Gemini evaluation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Gemini-powered suggestion/adjustment of instructional strategy
app.post("/api/questions/:id/strategy", async (req, res) => {
  try {
    const questionId = req.params.id;
    const db = await readDb();
    const qIdx = db.questions.findIndex((q: any) => q.id === questionId);
    if (qIdx === -1) {
      return res.status(404).json({ error: "Question not found" });
    }
    const question = db.questions[qIdx];
    const relatedSubmissions = db.submissions.filter((s: any) => s.questionId === questionId && s.evaluation);

    if (relatedSubmissions.length === 0) {
      return res.status(400).json({ error: "At least one evaluated student submission is required to analyze class performance trends." });
    }

    const totalScore = relatedSubmissions.reduce((acc: number, s: any) => acc + (s.evaluation?.score || 0), 0);
    const avgScore = totalScore / relatedSubmissions.length;

    // Collect weaknesses & low scored concepts
    const weaknessesList: string[] = [];
    const lowConceptsList: string[] = [];

    relatedSubmissions.forEach((s: any) => {
      if (s.evaluation?.weaknesses) {
        weaknessesList.push(...s.evaluation.weaknesses);
      }
      if (s.evaluation?.conceptCoverage) {
        s.evaluation.conceptCoverage.forEach((cc: any) => {
          if (cc.score < 70) {
            lowConceptsList.push(`${cc.concept} (Student scored: ${cc.score}%)`);
          }
        });
      }
    });

    const ai = getGeminiClient();

    const prompt = `
You are a brilliant Pedagogical Consultant and Instructional Designer. Your goal is to help an instructor adjust their teaching strategies based on student performance trends on a specific descriptive question.

--- QUESTION DETAILS ---
Title: ${question.title}
Subject: ${question.subject}
Question: ${question.questionText}
Model Answer: ${question.modelAnswer}

--- CLASS STATISTICS ---
Total Evaluated Submissions: ${relatedSubmissions.length}
Class Average Score: ${avgScore.toFixed(2)} out of ${question.maxPoints}

--- COLLECTED CLASSROOM GAPS & WEAKNESSES ---
Common weaknesses reported in grading:
${Array.from(new Set(weaknessesList)).map(w => `- ${w}`).join("\n")}

Rubric criteria that students struggled with:
${Array.from(new Set(lowConceptsList)).map(lc => `- ${lc}`).join("\n")}

Task:
Analyze these learning gaps and generate a highly action-oriented 'Instructional Strategy Adjustment Report' in Markdown.
It must include:
1. **Trend Analysis Summary**: A brief diagnostic review of why the class is struggling with these specific concepts (e.g. key misconceptions, missing vocabulary, or confusion of variables).
2. **Immediate Classroom Interventions**: Specific active-learning exercises, free-body diagrams, analogies, or laboratory experiments the instructor should conduct next lecture to address these exact gaps.
3. **Refinement of Model Answer / Rubric**: Suggest how the teacher could clarify the question phrasing or break down the model answer rubrics to set clearer expectations for students.
4. **Targeted Remedial Task**: A short follow-up activity or practice quiz topic that can help students recover their scores.

Be encouraging, professional, and practical. Return a JSON response with a single field 'strategy' containing the markdown text.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategy: { type: Type.STRING, description: "Detailed Markdown-formatted instructional strategy recommendations" }
          },
          required: ["strategy"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Empty response received from Gemini.");
    }

    const result = JSON.parse(resultText.trim());
    db.questions[qIdx].instructionalStrategy = result.strategy;
    db.questions[qIdx].strategyUpdatedAt = new Date().toISOString();
    await writeDb(db);

    res.json({
      instructionalStrategy: result.strategy,
      strategyUpdatedAt: db.questions[qIdx].strategyUpdatedAt
    });
  } catch (err: any) {
    console.error("Gemini strategy generation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Dashboard aggregates endpoint
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const db = await readDb();
    const { questions, submissions } = db;

    // Calculate overall statistics
    const gradedSubmissions = submissions.filter((s: any) => s.evaluation);
    const totalSubmissionsCount = submissions.length;
    const gradedCount = gradedSubmissions.length;
    const pendingCount = totalSubmissionsCount - gradedCount;

    let overallAvgScorePct = 0;
    let overallAvgSimilarity = 0;
    if (gradedCount > 0) {
      const sumScorePct = gradedSubmissions.reduce((acc: number, s: any) => {
        const q = questions.find((q: any) => q.id === s.questionId);
        const maxPts = q ? q.maxPoints : 10;
        return acc + ((s.evaluation.score / maxPts) * 100);
      }, 0);
      overallAvgScorePct = sumScorePct / gradedCount;

      const sumSimilarity = gradedSubmissions.reduce((acc: number, s: any) => acc + s.evaluation.semanticSimilarityScore, 0);
      overallAvgSimilarity = sumSimilarity / gradedCount;
    }

    // Question performance
    const questionTrends = questions.map((q: any) => {
      const qSubs = submissions.filter((s: any) => s.questionId === q.id);
      const qGraded = qSubs.filter((s: any) => s.evaluation);
      
      let averageScore = 0;
      let averageSimilarity = 0;
      if (qGraded.length > 0) {
        averageScore = qGraded.reduce((sum: number, s: any) => sum + s.evaluation.score, 0) / qGraded.length;
        averageSimilarity = qGraded.reduce((sum: number, s: any) => sum + s.evaluation.semanticSimilarityScore, 0) / qGraded.length;
      }

      // Calculate rubric concept averages
      const conceptAverages = q.rubricCriteria.map((concept: string) => {
        let totalConceptScore = 0;
        let count = 0;
        qGraded.forEach((s: any) => {
          const matchedConcept = s.evaluation.conceptCoverage?.find((cc: any) => cc.concept === concept);
          if (matchedConcept) {
            totalConceptScore += matchedConcept.score;
            count++;
          }
        });
        return {
          concept,
          averageScore: count > 0 ? Math.round(totalConceptScore / count) : 0
        };
      });

      return {
        questionId: q.id,
        questionTitle: q.title,
        subject: q.subject,
        averageScore: parseFloat(averageScore.toFixed(2)),
        averageSemanticSimilarity: parseFloat(averageSimilarity.toFixed(2)),
        totalSubmissions: qSubs.length,
        gradedCount: qGraded.length,
        conceptAverages,
        maxPoints: q.maxPoints,
        instructionalStrategy: q.instructionalStrategy,
        strategyUpdatedAt: q.strategyUpdatedAt
      };
    });

    // Subject averages
    const subjects = Array.from(new Set(questions.map((q: any) => q.subject))) as string[];
    const subjectStats = subjects.map(subj => {
      const subjQuestions = questions.filter((q: any) => q.subject === subj);
      const qIds = subjQuestions.map(q => q.id);
      const subjSubmissions = gradedSubmissions.filter((s: any) => qIds.includes(s.questionId));
      
      let avgScorePct = 0;
      if (subjSubmissions.length > 0) {
        const sumScorePct = subjSubmissions.reduce((acc: number, s: any) => {
          const q = questions.find((q: any) => q.id === s.questionId);
          const maxPts = q ? q.maxPoints : 10;
          return acc + ((s.evaluation.score / maxPts) * 100);
        }, 0);
        avgScorePct = sumScorePct / subjSubmissions.length;
      }

      return {
        subject: subj,
        averageScorePct: parseFloat(avgScorePct.toFixed(1)),
        count: subjSubmissions.length
      };
    });

    res.json({
      overview: {
        totalQuestions: questions.length,
        totalSubmissions: totalSubmissionsCount,
        gradedSubmissions: gradedCount,
        pendingSubmissions: pendingCount,
        averageScorePct: parseFloat(overallAvgScorePct.toFixed(1)),
        averageSimilarity: parseFloat(overallAvgSimilarity.toFixed(1))
      },
      questionTrends,
      subjectStats
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Vite & Static file handler configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
