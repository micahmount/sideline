import { describe, it, expect } from 'vitest'
import migrationSql from '../migrations/001_initial.sql?raw'
import * as seasons from './seasons'
import * as teams from './teams'
import * as players from './players'
import * as positions from './positions'
import * as profiles from './profiles'
import * as games from './games'
import * as events from './events'

async function createDb() {
  const sqlite3 = await import('@sqlite.org/sqlite-wasm').then((m) => m.default())
  const db = new sqlite3.oo1.DB(':memory:')
  db.exec(migrationSql)

  const exec = async (sql: string, params?: unknown[]) => {
    const rows: Record<string, unknown>[] = []
    const stmt = db.prepare(sql)
    if (params) stmt.bind(params as never)
    while (stmt.step()) {
      const row: Record<string, unknown> = {}
      for (let i = 0; i < stmt.columnCount; i++) {
        row[stmt.getColumnName(i)] = stmt.get(i)
      }
      rows.push(row)
    }
    stmt.finalize()
    return rows
  }

  return { db, exec }
}

describe('seasons', () => {
  it('CRUD round-trip', async () => {
    const { exec } = await createDb()
    const s = await seasons.createSeason(exec, { coachId: 'c1', name: 'Spring', year: 2026, division: 'U12' })
    expect(s.name).toBe('Spring')

    const got = await seasons.getSeason(exec, s.id)
    expect(got).toEqual(s)

    const list = await seasons.listSeasons(exec)
    expect(list).toHaveLength(1)

    await seasons.updateSeason(exec, s.id, { name: 'Fall' })
    const updated = await seasons.getSeason(exec, s.id)
    expect(updated!.name).toBe('Fall')

    await seasons.deleteSeason(exec, s.id)
    expect(await seasons.listSeasons(exec)).toHaveLength(0)
  })
})

describe('teams', () => {
  it('CRUD round-trip', async () => {
    const { exec } = await createDb()
    await seasons.createSeason(exec, { coachId: 'c1', name: 'S', year: 2026 })
    const season = (await seasons.listSeasons(exec))[0]!

    const t = await teams.createTeam(exec, { seasonId: season.id, name: 'Thunder', format: '7v7', fieldPlayerCount: 7 })
    expect(t.name).toBe('Thunder')

    const got = await teams.getTeam(exec, t.id)
    expect(got).toEqual(t)

    await teams.updateTeam(exec, t.id, { name: 'Lightning' })
    expect((await teams.getTeam(exec, t.id))!.name).toBe('Lightning')

    await teams.deleteTeam(exec, t.id)
    expect(await teams.listTeams(exec, season.id)).toHaveLength(0)
  })
})

describe('players', () => {
  it('CRUD round-trip', async () => {
    const { exec } = await createDb()
    await seasons.createSeason(exec, { coachId: 'c1', name: 'S', year: 2026 })
    const season = (await seasons.listSeasons(exec))[0]!
    await teams.createTeam(exec, { seasonId: season.id, name: 'T', format: '7v7', fieldPlayerCount: 7 })
    const team = (await teams.listTeams(exec, season.id))[0]!

    const p = await players.createPlayer(exec, { teamId: team.id, name: 'Alex', jerseyNumber: '10' })
    expect(p.name).toBe('Alex')

    const got = await players.getPlayer(exec, p.id)
    expect(got).toEqual(p)

    await players.updatePlayer(exec, p.id, { isActive: false })
    expect((await players.getPlayer(exec, p.id))!.isActive).toBe(false)

    await players.deletePlayer(exec, p.id)
    expect(await players.listPlayers(exec, team.id)).toHaveLength(0)
  })
})

describe('position_templates', () => {
  it('CRUD round-trip', async () => {
    const { exec } = await createDb()
    await seasons.createSeason(exec, { coachId: 'c1', name: 'S', year: 2026 })
    const season = (await seasons.listSeasons(exec))[0]!
    await teams.createTeam(exec, { seasonId: season.id, name: 'T', format: '7v7', fieldPlayerCount: 7 })
    const team = (await teams.listTeams(exec, season.id))[0]!

    const pt = await positions.createPositionTemplate(exec, {
      teamId: team.id, templateName: '4-3-3', slotName: 'LB', category: 'DEF', fieldX: 0.2, fieldY: 0.3,
    })
    expect(pt.slotName).toBe('LB')

    const got = await positions.getPositionTemplate(exec, pt.id)
    expect(got).toEqual(pt)

    await positions.updatePositionTemplate(exec, pt.id, { slotName: 'RB' })
    expect((await positions.getPositionTemplate(exec, pt.id))!.slotName).toBe('RB')

    await positions.deletePositionTemplate(exec, pt.id)
    expect(await positions.listPositionTemplates(exec, team.id)).toHaveLength(0)
  })
})

describe('playing_time_profiles', () => {
  it('CRUD round-trip', async () => {
    const { exec } = await createDb()
    await seasons.createSeason(exec, { coachId: 'c1', name: 'S', year: 2026 })
    const season = (await seasons.listSeasons(exec))[0]!
    await teams.createTeam(exec, { seasonId: season.id, name: 'T', format: '7v7', fieldPlayerCount: 7 })
    const team = (await teams.listTeams(exec, season.id))[0]!

    const pr = await profiles.createProfile(exec, { teamId: team.id, name: 'Equal', strategy: 'equal_time' })
    expect(pr.name).toBe('Equal')

    const got = await profiles.getProfile(exec, pr.id)
    expect(got).toEqual(pr)

    await profiles.updateProfile(exec, pr.id, { name: 'Position Aware', strategy: 'position_aware' })
    const updated = await profiles.getProfile(exec, pr.id)
    expect(updated!.strategy).toBe('position_aware')

    await profiles.deleteProfile(exec, pr.id)
    expect(await profiles.listProfiles(exec, team.id)).toHaveLength(0)
  })
})

describe('games + game_rosters', () => {
  it('CRUD round-trip', async () => {
    const { exec } = await createDb()
    await seasons.createSeason(exec, { coachId: 'c1', name: 'S', year: 2026 })
    const season = (await seasons.listSeasons(exec))[0]!
    await teams.createTeam(exec, { seasonId: season.id, name: 'T', format: '7v7', fieldPlayerCount: 7 })
    const team = (await teams.listTeams(exec, season.id))[0]!
    await profiles.createProfile(exec, { teamId: team.id, name: 'Equal', strategy: 'equal_time' })
    const profile = (await profiles.listProfiles(exec, team.id))[0]!

    const g = await games.createGame(exec, {
      teamId: team.id, profileId: profile.id, opponent: 'Rivals', scheduledAt: '2026-04-01T10:00:00Z', periodCount: 2, periodLengthMinutes: 40,
    })
    expect(g.opponent).toBe('Rivals')

    await games.updateGame(exec, g.id, { status: 'in_progress' })
    expect((await games.getGame(exec, g.id))!.status).toBe('in_progress')

    const rosterEntry = await games.addToGameRoster(exec, { gameId: g.id, playerId: 'p1' })
    expect(rosterEntry.available).toBe(true)

    await games.updateGameRoster(exec, rosterEntry.id, { available: false })
    expect((await games.listGameRoster(exec, g.id))[0]!.available).toBe(false)

    await games.removeFromGameRoster(exec, rosterEntry.id)
    expect(await games.listGameRoster(exec, g.id)).toHaveLength(0)

    await games.deleteGame(exec, g.id)
    expect(await games.listGames(exec, team.id)).toHaveLength(0)
  })
})

describe('game_events', () => {
  it('append and list', async () => {
    const { exec } = await createDb()

    const ev = await events.appendEvent(exec, {
      gameId: 'g1', type: 'GAME_STARTED', payload: {}, gameClockSeconds: 0,
    })
    expect(ev.type).toBe('GAME_STARTED')

    const list = await events.listEvents(exec, 'g1')
    expect(list).toHaveLength(1)
    expect(list[0]!.type).toBe('GAME_STARTED')
  })
})
