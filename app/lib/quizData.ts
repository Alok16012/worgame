export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  category: "basics" | "matka_terminology" | "math_logic" | "market_timing";
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Matka main 'Single' kis cheez ko refer karta hai?",
    options: ["Game", "Chart", "Digit [0-9]", "Guess"],
    answerIndex: 2,
    explanation: "'Single' ya 'Single Ank' 0 se 9 tak ke kisi ek single digit ko darshata hai.",
    category: "matka_terminology",
  },
  {
    id: 2,
    question: "Matka chart ka mukhya uddeshya kya hota hai?",
    options: ["Historical result analysis", "Online payment transfer", "Live voice calling", "Market buying & selling"],
    answerIndex: 0,
    explanation: "Chart ka prayog pichle dino ke market results aur open/close pana trends ko analyze karne ke liye hota hai.",
    category: "basics",
  },
  {
    id: 3,
    question: "Ek standard 'Jodi' me kitne digits hote hain?",
    options: ["1 Digit", "2 Digits", "3 Digits", "4 Digits"],
    answerIndex: 1,
    explanation: "Jodi me hamesha 2 digits hote hain (00 se 99 tak), jisme pehla digit Open Ank aur dusra Close Ank hota hai.",
    category: "matka_terminology",
  },
  {
    id: 4,
    question: "Single Pana (Panna) me kitne digits hote hain?",
    options: ["2 Digits", "3 Digits (All Different)", "4 Digits", "5 Digits"],
    answerIndex: 1,
    explanation: "Single Pana 3 alag-alag digits ka ascending order combination hota hai (e.g. 123, 248, 567).",
    category: "matka_terminology",
  },
  {
    id: 5,
    question: "Double Pana me kya visheshata hoti hai?",
    options: ["Sabhi 3 digits same hote hain", "2 digits same aur 1 alag hota hai", "Teeno digits sequential hote hain", "Kewal even numbers hote hain"],
    answerIndex: 1,
    explanation: "Double Pana me koi 2 digits samaan (same) hote hain aur 1 alag hota hai (e.g. 112, 225, 779).",
    category: "matka_terminology",
  },
  {
    id: 6,
    question: "Triple Pana (TP) me digits ka pattern kya hota hai?",
    options: ["Teeno digits identical (same) hote hain", "2 digits zero hote hain", "Teeno digits odd hote hain", "Kewal 777 hota hai"],
    answerIndex: 0,
    explanation: "Triple Pana me teeno digits identical hote hain (e.g. 000, 111, 222, 333, 444, 555, 666, 777, 888, 999).",
    category: "matka_terminology",
  },
  {
    id: 7,
    question: "Agar Pana '123' hai to iska Single Ank kya hoga? (Formula: 1 + 2 + 3 = 6)",
    options: ["6", "5", "1", "3"],
    answerIndex: 0,
    explanation: "Pana ke sabhi 3 digits ka sum karne ke baad last digit Single Ank hota hai. Yahan 1+2+3 = 6.",
    category: "math_logic",
  },
  {
    id: 8,
    question: "Agar Pana '589' hai to iska sum 22 hai. Iska single ank kya hoga?",
    options: ["2 (Last digit of sum)", "5", "8", "9"],
    answerIndex: 0,
    explanation: "Sum 22 ka rightmost (last) digit 2 hai, isliye single ank 2 hoga.",
    category: "math_logic",
  },
  {
    id: 9,
    question: "Half Sangam me kin do parts ka combination banta hai?",
    options: ["Open Pana + Close Ank ya Open Ank + Close Pana", "Single Ank + Jodi", "Dono Pana ek saath", "Kewal Close Session"],
    answerIndex: 0,
    explanation: "Half Sangam me ek session ka 3-digit Pana aur dusre session ka 1-digit Ank judta hai.",
    category: "matka_terminology",
  },
  {
    id: 10,
    question: "Full Sangam calculation me kya include hota hai?",
    options: ["Open Pana + Close Pana", "Open Ank + Close Ank", "Kewal Open Jodi", "Market Timing Interval"],
    answerIndex: 0,
    explanation: "Full Sangam me Open session ka 3-digit Pana aur Close session ka 3-digit Pana shamil hota hai (e.g. 123-456).",
    category: "matka_terminology",
  },
  {
    id: 11,
    question: "Starline market results kis frequency me aate hain?",
    options: ["Har ghante (Hourly slots)", "Har 24 ghante me ek baar", "Har 15 minute me", "Kewal Sunday ko"],
    answerIndex: 0,
    explanation: "Starline market me aamtaur par subah se raat tak har 1 ghante me result open hota hai.",
    category: "market_timing",
  },
  {
    id: 12,
    question: "Gali Desawar market me result kis format me display hota hai?",
    options: ["2-Digit Jodi", "3-Digit Pana", "4-Digit Alpha-numeric", "Roman Numerals"],
    answerIndex: 0,
    explanation: "Gali Desawar games me result sidha 2-digit Jodi ke roop me ghoshit hota hai.",
    category: "matka_terminology",
  },
  {
    id: 13,
    question: "Digit '4' ka Cut Digit kya hota hai? (Formula: (4 + 5) % 10)",
    options: ["9", "5", "8", "1"],
    answerIndex: 0,
    explanation: "Cut digit formula me digit me 5 add kiya jata hai: 4 + 5 = 9. Isliye 4 ka cut 9 hota hai.",
    category: "math_logic",
  },
  {
    id: 14,
    question: "Digit '0' ka Cut Digit kya hota hai?",
    options: ["5", "1", "9", "0"],
    answerIndex: 0,
    explanation: "0 + 5 = 5. Zero ka cut digit 5 hota hai.",
    category: "math_logic",
  },
  {
    id: 15,
    question: "Market holiday ke din market board kya status display karta hai?",
    options: ["HOLIDAY TODAY / CLOSED", "OPEN FOR QUIZ", "SPECIAL SESSION", "SYSTEM RESET"],
    answerIndex: 0,
    explanation: "Market off-days (e.g. Saturday/Sunday for certain markets) par board HOLIDAY TODAY darshata hai.",
    category: "market_timing",
  },
  {
    id: 16,
    question: "Agar Open Pana 137 aur Close Pana 248 hai, to Jodi kya banegi? (Sum 1: 1+3+7=11 -> 1, Sum 2: 2+4+8=14 -> 4)",
    options: ["14", "11", "78", "41"],
    answerIndex: 0,
    explanation: "Open ank 1 aur close ank 4 milkar Jodi '14' banate hain.",
    category: "math_logic",
  },
  {
    id: 17,
    question: "Panel Chart me kaunse parameters visualize kiye jate hain?",
    options: ["Daily Open Pana, Jodi, aur Close Pana", "Sirf User names", "Wallet receipts", "Weekly quiz ranks"],
    answerIndex: 0,
    explanation: "Panel Chart me har tarikh ka Open Pana, Result Jodi, aur Close Pana ek saath tabular format me hota hai.",
    category: "basics",
  },
  {
    id: 18,
    question: "Main Market me 'Open Time' aur 'Close Time' kya denote karte hain?",
    options: ["Open result ghoshit hone ka samay aur Close result ghoshit hone ka samay", "App band hone ka samay", "Internet speed", "Bank timing"],
    answerIndex: 0,
    explanation: "Open Time first session result aur Close Time second session result ke nirdharit samay ko darshata hai.",
    category: "market_timing",
  },
  {
    id: 19,
    question: "Golden Ank (Golden Digit) ka math calculation me kya mahatva hai?",
    options: ["High probability trending digits", "Random lucky alphabet", "Market closing discount", "Bonus code"],
    answerIndex: 0,
    explanation: "Golden Ank historical frequency analysis ke aadhar par nikaale gaye statistical probability digits hote hain.",
    category: "basics",
  },
  {
    id: 20,
    question: "Market me 'Family Jodi' me kitni Jodiyan hoti hain?",
    options: ["8 Jodiyan", "4 Jodiyan", "2 Jodiyan", "16 Jodiyan"],
    answerIndex: 0,
    explanation: "Ek single Jodi ki cut aur reverse combinations milakar 8 Family Jodiyan banti hain.",
    category: "math_logic",
  }
];

export function getQuizForMarket(marketName?: string, count: number = 10): QuizQuestion[] {
  // Shuffle questions randomly or select 10 questions
  const shuffled = [...QUIZ_QUESTIONS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
