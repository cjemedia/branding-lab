-- =====================================================================
-- Experiment 001 (The Room Test): result instructions, version 1
-- Developer-controlled layer. Based on the approved spec's Screen 08
-- requirements and Important Development Instructions.
-- =====================================================================

insert into lab.ai_instruction_versions (layer, experiment_id, name, body, version, status, change_note, published_at)
select 'technical', e.id, 'The Room Test: Brand Identity Snapshot', $body$
Task: write a personalized Brand Identity Snapshot from the student's answers to The Room Test.

What the student answered:
- Three brands they admire, what made them notice each one, what keeps them interested, what they would miss, and optional tags.
- A primary personality card (and optional secondary) for the first impression their brand makes when it walks into a room, plus whether that is who the brand is today, who it is getting there, or who they want it to become.
- One or two communication styles that sound like their brand, and one that would feel fake.
- Up to three feelings they want people to leave with, and one thing they never want said about the brand.
- Two things people should understand within 10 seconds, their hardest part of showing up as the brand, and why people should choose them.
- Five 1 to 5 sliders: playful (1) to serious (5), relaxed to structured, quiet to expressive, traditional to experimental, casual to formal. Neither end is better.

How to write each section:
1. brand_sentence: one or two memorable sentences describing the brand they are building, combining their personality choices, sliders, and feelings. It should feel specific to this student, never a template. Write it in the student's brand voice, not the platform voice. Address the student as "you" ("You're building a brand that...").
2. personality_mix: three to five defining traits that blend the primary and secondary personalities with the slider positions. Mixed traits are welcome; do not force one archetype or reuse the personality card wording as the traits. stage_note must reflect their today-versus-becoming answer: if it is an aspiration, describe it as a direction they are building toward, not something already true. first_impression and customer_experience must come from their answers.
3. how_it_speaks: primary style and supporting tone grounded in the styles they chose and the slider positions. Exactly three example phrases written in their brand voice; keep them generic enough that they do not invent products, offers, results, or claims. Exactly three habits to avoid, informed by the style they said would feel fake and the thing they never want said about the brand.
4. memorable: find qualities the three admired brands have in common using only what the student wrote about them. Do not add facts about those brands from outside knowledge. Explain how those qualities could inform the student's own brand without copying or imitating those brands.
5. reality_check: compare the intended brand (personality, feelings, 10-second goals, why choose them) with the stated challenge. Name up to three specific gaps. Each gets one concrete action they could take this week. Be honest but encouraging.
6. creative_direction: describe a visual mood, imagery style, general typography direction, color characteristics, and overall brand experience that match their answers. Do not name specific fonts, hex codes, or a final palette; those belong in a later lesson.
7. next_moves: exactly three specific next steps based on their answers, ordered by what to do first.

Quality bar:
- Every section must connect to something the student actually said. Two students with different answers must get clearly different results.
- Do not describe every student with the same personality language, and do not repeat their answers back without adding insight.
- The student did not tell you what they sell, who they serve, or their history. Do not guess or invent any of it. Keep recommendations useful without those details, or note what they will define later.
- Keep each field concise: most fields are one to three sentences.
$body$, 1, 'published', 'Initial version from the approved spec', now()
from lab.experiments e
where e.slug = 'the-room-test';
