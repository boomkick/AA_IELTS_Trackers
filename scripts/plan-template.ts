// Course content for the 8-week plan. Used only by gen-seed.ts to produce the seed SQL.
// After seeding, the teacher edits tasks in the app.
//
// Classes: Mon & Fri 20:00–21:30, one chapter of "The Official Cambridge Guide to IELTS"
// (Academic only). Weeks 1–4 Listening, weeks 5–8 Reading. Off days: 60 min,
// 15 min Anki + 45 min work from the same book.

export type Skill = 'Listening' | 'Reading'

export interface Chapter {
  skill: Skill
  number: number
  title: string
  focus: string
}

export const LISTENING: Chapter[] = [
  { skill: 'Listening', number: 1, title: 'Getting ready to listen', focus: 'test format, predicting answers before you listen' },
  { skill: 'Listening', number: 2, title: 'Following a conversation', focus: 'Section 1 style conversations, form and note completion' },
  { skill: 'Listening', number: 3, title: 'Recognising paraphrase', focus: 'hearing the same idea in different words' },
  { skill: 'Listening', number: 4, title: 'Places and directions', focus: 'map and plan labelling' },
  { skill: 'Listening', number: 5, title: 'Listening for actions and processes', focus: 'flow-charts and process questions' },
  { skill: 'Listening', number: 6, title: 'Attitude and opinion', focus: 'speakers’ opinions, multiple choice and matching' },
  { skill: 'Listening', number: 7, title: 'Following a lecture or talk', focus: 'Section 4 lectures, note completion' },
  { skill: 'Listening', number: 8, title: 'Contrasting ideas', focus: 'signposts and contrasting points' },
]

// Chapter 8 (General Training Reading) is skipped: Academic only.
export const READING: Chapter[] = [
  { skill: 'Reading', number: 1, title: 'Reading strategies', focus: 'skimming, scanning and time management' },
  { skill: 'Reading', number: 2, title: 'Descriptive passages', focus: 'following descriptions; completion tasks' },
  { skill: 'Reading', number: 3, title: 'Understanding the main ideas', focus: 'main ideas, matching headings' },
  { skill: 'Reading', number: 4, title: 'Locating and matching', focus: 'matching information and features' },
  { skill: 'Reading', number: 5, title: 'Discursive passages', focus: 'following an argument' },
  { skill: 'Reading', number: 6, title: 'Multiple-choice questions', focus: 'multiple-choice strategies' },
  { skill: 'Reading', number: 7, title: 'Opinions and attitudes', focus: 'writers’ views, Yes / No / Not Given' },
]

/** Practice tests at the back of the book, used on Wed/Sun (in order). */
export const LISTENING_PRACTICE = [
  'Practice Test 1 – Listening Sections 1–2', 'Practice Test 1 – Listening Sections 3–4',
  'Practice Test 2 – Listening Sections 1–2', 'Practice Test 2 – Listening Sections 3–4',
  'Practice Test 3 – Listening Sections 1–2', 'Practice Test 3 – Listening Sections 3–4',
  'Practice Test 4 – Listening Sections 1–2', 'Practice Test 4 – Listening Sections 3–4',
]
export const READING_PRACTICE = [
  'Practice Test 1 – Reading Passage 1', 'Practice Test 1 – Reading Passage 2',
  'Practice Test 1 – Reading Passage 3', 'Practice Test 2 – Reading Passage 1',
  'Practice Test 2 – Reading Passage 2', 'Practice Test 2 – Reading Passage 3',
  'Practice Test 3 – Reading Passage 1',
]
/** Final full tests in the last week (exceptions to the 1-hour rule). */
export const FINAL_LISTENING_TEST = 'Practice Test 5 – full Listening test'
export const FINAL_READING_TEST = 'Practice Test 5 – full Reading test (Academic)'

export interface VocabSeed { word: string; ipa: string; definitionEn: string; meaningVi: string; example: string; collocations: string[]; weekNumber?: number }

export const vocabulary: VocabSeed[] = [
  { word: 'accommodation', ipa: '/əˌkɒməˈdeɪʃn/', definitionEn: 'a place to live or stay', meaningVi: 'chỗ ở', example: 'The price includes flights and accommodation.', collocations: ['student accommodation', 'book accommodation'], weekNumber: 1 },
  { word: 'deposit', ipa: '/dɪˈpɒzɪt/', definitionEn: 'money paid in advance as security', meaningVi: 'tiền đặt cọc', example: 'You need to pay a £50 deposit to reserve the room.', collocations: ['pay a deposit', 'refundable deposit'], weekNumber: 1 },
  { word: 'itinerary', ipa: '/aɪˈtɪnərəri/', definitionEn: 'a planned route or journey', meaningVi: 'lịch trình', example: 'Our itinerary includes three days in Edinburgh.', collocations: ['detailed itinerary', 'plan an itinerary'], weekNumber: 1 },
  { word: 'adjacent', ipa: '/əˈdʒeɪsnt/', definitionEn: 'next to or near something', meaningVi: 'liền kề', example: 'The café is adjacent to the main entrance.', collocations: ['adjacent to', 'adjacent room'], weekNumber: 2 },
  { word: 'facility', ipa: '/fəˈsɪləti/', definitionEn: 'a building or equipment provided for a purpose', meaningVi: 'cơ sở vật chất', example: 'The sports facilities are open until 10 pm.', collocations: ['sports facilities', 'leisure facility'], weekNumber: 2 },
  { word: 'methodology', ipa: '/ˌmeθəˈdɒlədʒi/', definitionEn: 'a system of methods used in research', meaningVi: 'phương pháp luận', example: 'We need to explain our methodology in the report.', collocations: ['research methodology', 'adopt a methodology'], weekNumber: 3 },
  { word: 'feasible', ipa: '/ˈfiːzəbl/', definitionEn: 'possible and practical to do', meaningVi: 'khả thi', example: 'Is it feasible to finish the survey by Friday?', collocations: ['economically feasible', 'technically feasible'], weekNumber: 3 },
  { word: 'habitat', ipa: '/ˈhæbɪtæt/', definitionEn: 'the natural home of an animal or plant', meaningVi: 'môi trường sống', example: 'Deforestation is destroying the orangutan’s habitat.', collocations: ['natural habitat', 'habitat loss'], weekNumber: 4 },
  { word: 'phenomenon', ipa: '/fəˈnɒmɪnən/', definitionEn: 'a fact or event that can be observed', meaningVi: 'hiện tượng', example: 'Migration is a well-documented natural phenomenon.', collocations: ['natural phenomenon', 'global phenomenon'], weekNumber: 4 },
  { word: 'substantial', ipa: '/səbˈstænʃl/', definitionEn: 'large in amount or importance', meaningVi: 'đáng kể', example: 'There has been a substantial increase in sales.', collocations: ['substantial increase', 'substantial evidence'], weekNumber: 5 },
  { word: 'undermine', ipa: '/ˌʌndəˈmaɪn/', definitionEn: 'to make something weaker gradually', meaningVi: 'làm suy yếu', example: 'Lack of sleep can undermine your concentration.', collocations: ['undermine confidence', 'seriously undermine'], weekNumber: 5 },
]
