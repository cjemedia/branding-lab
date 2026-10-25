import path from 'path'
import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { COMMUNICATION_STYLES, COPY, PERSONALITIES, STAGES } from '@/lib/experiments/room-test/config'
import type { RoomTestAnswers, RoomTestResult } from '@/lib/experiments/room-test/schema'

const fontDir = path.join(process.cwd(), 'assets', 'fonts')
Font.register({
  family: 'Montserrat',
  fonts: [
    { src: path.join(fontDir, 'montserrat-latin-400-normal.woff'), fontWeight: 400 },
    { src: path.join(fontDir, 'montserrat-latin-500-normal.woff'), fontWeight: 500 },
    { src: path.join(fontDir, 'montserrat-latin-600-normal.woff'), fontWeight: 600 },
    { src: path.join(fontDir, 'montserrat-latin-700-normal.woff'), fontWeight: 700 },
  ],
})
Font.registerHyphenationCallback((word) => [word])

const INK = '#111111'
const TIFFANY = '#81D8D0'
const TIFFANY_DARK = '#4FA69E'
const CREAM = '#F5F0E8'
const MUTED = '#6B6560'

const s = StyleSheet.create({
  page: { fontFamily: 'Montserrat', fontSize: 10, color: INK, backgroundColor: '#FFFFFF', paddingTop: 48, paddingBottom: 56, paddingHorizontal: 48, lineHeight: 1.5 },
  cover: { backgroundColor: INK, borderRadius: 12, padding: 28, marginBottom: 24 },
  eyebrow: { fontSize: 8, letterSpacing: 2, color: TIFFANY, fontWeight: 600 },
  coverTitle: { fontSize: 22, fontWeight: 700, color: '#FFFFFF', marginTop: 8 },
  coverBrand: { fontSize: 13, color: '#FFFFFF', marginTop: 14, fontWeight: 500 },
  coverLine: { height: 1, width: 40, backgroundColor: TIFFANY, marginTop: 14 },
  sentence: { fontSize: 13, color: '#FFFFFF', marginTop: 16, fontWeight: 500, lineHeight: 1.45 },
  section: { marginBottom: 18 },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: '#E4DDD1', paddingBottom: 6, marginBottom: 10 },
  sectionNumber: { fontSize: 9, fontWeight: 700, color: TIFFANY_DARK, marginRight: 8 },
  sectionTitle: { fontSize: 13, fontWeight: 700 },
  label: { fontSize: 7.5, letterSpacing: 1.5, color: MUTED, fontWeight: 600, marginTop: 8, marginBottom: 3 },
  body: { fontSize: 10 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  pill: { backgroundColor: '#E3F5F3', borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8, marginRight: 5, marginBottom: 5, fontSize: 9, fontWeight: 500 },
  bullet: { flexDirection: 'row', marginBottom: 3 },
  bulletMark: { width: 12, color: TIFFANY_DARK, fontWeight: 700 },
  card: { backgroundColor: CREAM, borderRadius: 8, padding: 10, marginBottom: 6 },
  cardTitle: { fontWeight: 600, marginBottom: 2 },
  closing: { marginTop: 14, fontSize: 12, fontWeight: 600, lineHeight: 1.45 },
  footer: { position: 'absolute', bottom: 24, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: MUTED },
})

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <View style={s.sectionHead} wrap={false}>
        <Text style={s.sectionNumber}>{n}</Text>
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View wrap={false}>
      <Text style={s.label}>{label.toUpperCase()}</Text>
      <Text style={s.body}>{children}</Text>
    </View>
  )
}

function Bullets({ items, quoted, numbered }: { items: string[]; quoted?: boolean; numbered?: boolean }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={i} style={s.bullet} wrap={false}>
          <Text style={s.bulletMark}>{numbered ? `${i + 1}.` : '|'}</Text>
          <Text style={{ flex: 1 }}>{quoted ? `"${item}"` : item}</Text>
        </View>
      ))}
    </View>
  )
}

export function RoomTestPdf({ result, answers, brandName }: { result: RoomTestResult; answers: RoomTestAnswers; brandName: string | null }) {
  const primary = PERSONALITIES.find((p) => p.id === answers.primaryPersonality)
  const secondary = PERSONALITIES.find((p) => p.id === answers.secondaryPersonality)
  const stage = STAGES.find((st) => st.id === answers.stage)
  const styles = COMMUNICATION_STYLES.filter((c) => answers.soundsLike.includes(c.id))

  return (
    <Document title="THE BRAND IDENTITY SNAPSHOT" author="The Branding Lab by CJE Media">
      <Page size="LETTER" style={s.page}>
        <View style={s.cover}>
          <Text style={s.eyebrow}>THE BRANDING LAB. | EXPERIMENT 001</Text>
          <Text style={s.coverTitle}>THE BRAND IDENTITY SNAPSHOT</Text>
          {brandName ? <Text style={s.coverBrand}>{brandName}</Text> : null}
          <View style={s.coverLine} />
          <Text style={s.sentence}>{result.brand_sentence}</Text>
        </View>

        <Section n="01" title="Your brand's personality mix">
          {primary ? <Field label="Primary personality">{primary.name}</Field> : null}
          {secondary ? <Field label="Secondary personality">{secondary.name}</Field> : null}
          <Field label={stage ? `Where you are: ${stage.label}` : 'Where you are'}>{result.personality_mix.stage_note}</Field>
          <View wrap={false}>
            <Text style={s.label}>DEFINING TRAITS</Text>
            <View style={s.pillRow}>
              {result.personality_mix.traits.map((t, i) => (
                <Text key={i} style={s.pill}>{t}</Text>
              ))}
            </View>
          </View>
          <Field label="Desired first impression">{result.personality_mix.first_impression}</Field>
          <Field label="Desired customer experience">{result.personality_mix.customer_experience}</Field>
        </Section>

        <Section n="02" title="How your brand speaks">
          {styles.length ? <Field label="Styles you chose">{styles.map((c) => c.name).join(' and ')}</Field> : null}
          <Field label="Primary communication style">{result.how_it_speaks.primary_style}</Field>
          <Field label="Supporting tone">{result.how_it_speaks.supporting_tone}</Field>
          <Text style={s.label}>PHRASES THAT FIT</Text>
          <Bullets items={result.how_it_speaks.example_phrases} quoted />
          <Text style={s.label}>HABITS TO AVOID</Text>
          <Bullets items={result.how_it_speaks.habits_to_avoid} />
        </Section>

        <Section n="03" title="What makes your brand memorable">
          <View style={s.pillRow}>
            {result.memorable.common_qualities.map((q, i) => (
              <Text key={i} style={s.pill}>{q}</Text>
            ))}
          </View>
          <Text style={[s.body, { marginTop: 4 }]}>{result.memorable.explanation}</Text>
        </Section>

        <Section n="04" title="Your brand's reality check">
          {result.reality_check.map((r, i) => (
            <View key={i} style={s.card} wrap={false}>
              <Text style={s.cardTitle}>{r.area}</Text>
              <Text>{r.why}</Text>
              <Text style={[s.label, { color: TIFFANY_DARK }]}>TRY THIS</Text>
              <Text>{r.action}</Text>
            </View>
          ))}
        </Section>

        <Section n="05" title="Your creative direction">
          <Field label="Visual mood">{result.creative_direction.visual_mood}</Field>
          <Field label="Photography and imagery">{result.creative_direction.imagery_style}</Field>
          <Field label="Typography direction">{result.creative_direction.typography_direction}</Field>
          <Field label="Color characteristics">{result.creative_direction.color_characteristics}</Field>
          <Field label="Overall brand experience">{result.creative_direction.brand_experience}</Field>
        </Section>

        <Section n="06" title="Your next move">
          <Bullets items={result.next_moves} numbered />
          <Text style={s.closing}>{COPY.reveal.closing}</Text>
        </Section>

        <View style={s.footer} fixed>
          <Text>The Branding Lab by CJE Media</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
