import { describe, test, expect } from 'vitest'
import {
  parseCSV,
  groupCSVRows,
  computeSummary,
  STATUS_ORDER,
  STATUS_LABELS,
  type InvitationCard,
} from '@/components/invitations/InvitationsClient'

// ─── parseCSV ────────────────────────────────────────────────────────────────

describe('parseCSV', () => {
  test('skips the header row', () => {
    const csv = 'Family Name,Side,Estimated Count,Contact Label,Phone,Email,Notes\nSharma Family,groom,4,Dad,+91 98765 43210,,\n'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].familyName).toBe('Sharma Family')
  })

  test('parses all fields correctly', () => {
    const csv = 'Family Name,Side,Estimated Count,Contact Label,Phone,Email,Notes\nMehta Family,bride,2,Mom,,mom@example.com,Close friends'
    const [row] = parseCSV(csv)
    expect(row.side).toBe('bride')
    expect(row.estimatedCount).toBe(2)
    expect(row.label).toBe('Mom')
    expect(row.email).toBe('mom@example.com')
    expect(row.notes).toBe('Close friends')
  })

  test('defaults estimatedCount to 1 when blank or NaN', () => {
    const csv = 'Family Name,Side,Estimated Count,Contact Label,Phone,Email,Notes\nXYZ,,abc,,,,'
    const [row] = parseCSV(csv)
    expect(row.estimatedCount).toBe(1)
  })

  test('filters out rows with empty family name', () => {
    const csv = 'Family Name,Side,Estimated Count,Contact Label,Phone,Email,Notes\n,groom,2,Dad,,,\nReal Family,groom,2,,,,\n'
    const rows = parseCSV(csv)
    expect(rows).toHaveLength(1)
    expect(rows[0].familyName).toBe('Real Family')
  })

  test('handles quoted fields containing commas', () => {
    const csv = 'Family Name,Side,Estimated Count,Contact Label,Phone,Email,Notes\n"Sharma, Gupta Family",groom,3,,,,'
    const [row] = parseCSV(csv)
    expect(row.familyName).toBe('Sharma, Gupta Family')
  })

  test('returns empty array when only header exists', () => {
    expect(parseCSV('Family Name,Side,Estimated Count')).toHaveLength(0)
  })
})

// ─── groupCSVRows ─────────────────────────────────────────────────────────────

describe('groupCSVRows', () => {
  test('groups multiple rows with the same family name into one card', () => {
    const rows = parseCSV(
      'Family Name,Side,Estimated Count,Contact Label,Phone,Email,Notes\n' +
      'Sharma Family,groom,4,Dad,+91 111,,\n' +
      'Sharma Family,groom,4,Mom,+91 222,,\n'
    )
    const groups = groupCSVRows(rows)
    expect(groups).toHaveLength(1)
    expect(groups[0].contacts).toHaveLength(2)
    expect(groups[0].contacts[0].phone).toBe('+91 111')
    expect(groups[0].contacts[1].phone).toBe('+91 222')
  })

  test('treats family name matching as case-insensitive', () => {
    const rows = parseCSV(
      'Family Name,Side,Estimated Count,Contact Label,Phone,Email,Notes\n' +
      'sharma family,groom,2,Dad,+91 111,,\n' +
      'Sharma Family,groom,2,Mom,+91 222,,\n'
    )
    const groups = groupCSVRows(rows)
    expect(groups).toHaveLength(1)
    expect(groups[0].contacts).toHaveLength(2)
  })

  test('two different families produce two groups', () => {
    const rows = parseCSV(
      'Family Name,Side,Estimated Count,Contact Label,Phone,Email,Notes\n' +
      'Sharma Family,groom,4,Dad,+91 111,,\n' +
      'Mehta Family,bride,2,Mom,+91 222,,\n'
    )
    const groups = groupCSVRows(rows)
    expect(groups).toHaveLength(2)
  })

  test('rows with no phone/email/label are not added as contacts', () => {
    const rows = parseCSV(
      'Family Name,Side,Estimated Count,Contact Label,Phone,Email,Notes\n' +
      'Solo Family,groom,1,,,,\n'
    )
    const groups = groupCSVRows(rows)
    expect(groups[0].contacts).toHaveLength(0)
  })
})

// ─── computeSummary ───────────────────────────────────────────────────────────

const mockCards = (overrides: Partial<InvitationCard>[]): InvitationCard[] =>
  overrides.map((o, i) => ({
    id: `id-${i}`,
    wedding_id: 'w1',
    family_name: `Family ${i}`,
    side: 'groom',
    estimated_count: 2,
    status: 'not_contacted',
    notes: null,
    invitation_contacts: [],
    ...o,
  }))

describe('computeSummary', () => {
  test('counts total families', () => {
    const { total } = computeSummary(mockCards([{}, {}, {}]))
    expect(total).toBe(3)
  })

  test('sums estimated people', () => {
    const { totalPeople } = computeSummary(mockCards([
      { estimated_count: 4 },
      { estimated_count: 2 },
    ]))
    expect(totalPeople).toBe(6)
  })

  test('separates groom and bride side counts', () => {
    const { groomPeople, bridePeople } = computeSummary(mockCards([
      { side: 'groom', estimated_count: 4 },
      { side: 'bride', estimated_count: 3 },
      { side: 'both', estimated_count: 2 },
    ]))
    expect(groomPeople).toBe(6) // groom (4) + both (2)
    expect(bridePeople).toBe(5) // bride (3) + both (2)
  })

  test('counts confirmed families correctly', () => {
    const { byStatus } = computeSummary(mockCards([
      { status: 'confirmed' },
      { status: 'confirmed' },
      { status: 'called' },
      { status: 'not_contacted' },
    ]))
    expect(byStatus.confirmed).toBe(2)
    expect(byStatus.called).toBe(1)
    expect(byStatus.not_contacted).toBe(1)
    expect(byStatus.invite_sent).toBe(0)
  })

  test('returns zeros for empty list', () => {
    const s = computeSummary([])
    expect(s.total).toBe(0)
    expect(s.totalPeople).toBe(0)
    expect(s.byStatus.confirmed).toBe(0)
  })
})

// ─── STATUS_ORDER / STATUS_LABELS ─────────────────────────────────────────────

describe('status constants', () => {
  test('STATUS_ORDER has 4 entries ending with confirmed', () => {
    expect(STATUS_ORDER).toHaveLength(4)
    expect(STATUS_ORDER[STATUS_ORDER.length - 1]).toBe('confirmed')
  })

  test('every status in STATUS_ORDER has a label', () => {
    for (const s of STATUS_ORDER) {
      expect(STATUS_LABELS[s]).toBeTruthy()
    }
  })
})
