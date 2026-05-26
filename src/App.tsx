import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { BattleConfig, RosterEntry, SaveState, UnitTypeId, ArenaType } from './game/types';
import type { SavedBase } from './multiplayer/types';
import { CAMPAIGN } from './game/campaign';
import { defaultSave, loadSave, writeSave } from './game/campaign';
import { ARENA_COLLISION_ZONES } from './game/arenaBuilder';
import { authPlayer, reportRaidResult } from './multiplayer/api';

import { MainMenu } from './screens/MainMenu';
import { CampaignMap } from './screens/CampaignMap';
import { PreBattle } from './screens/PreBattle';
import { BattleScreen } from './screens/BattleScreen';
import { PostBattle } from './screens/PostBattle';
import { Ending } from './screens/Ending';
import { SandboxSetup } from './screens/SandboxSetup';
import { MultiplayerMenu } from './screens/MultiplayerMenu';
import { PvPLobby } from './screens/PvPLobby';
import { PvPBattleScreen } from './screens/PvPBattleScreen';
import { BaseEditor } from './screens/BaseEditor';
import { RaidLobby } from './screens/RaidLobby';

function getOrCreatePlayerId(): string {
  const key = 'wc_player_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

type Screen =
  | 'menu' | 'campaign' | 'preBattle' | 'battle' | 'postBattle' | 'ending'
  | 'sandboxSetup' | 'sandboxBattle'
  | 'multiplayerMenu' | 'pvpLobby' | 'pvpBattle' | 'baseEditor' | 'raidLobby' | 'raidBattle';

export default function App() {
  const [save, setSave] = useState<SaveState>(() => loadSave() ?? defaultSave());
  const [hasSave] = useState<boolean>(() => loadSave() !== null);
  const [screen, setScreen] = useState<Screen>('menu');
  const [activeChapter, setActiveChapter] = useState<number>(save.currentChapter);
  const [battleConfig, setBattleConfig] = useState<BattleConfig | null>(null);
  const [battleResult, setBattleResult] = useState<'player' | 'enemy' | null>(null);
  const [sandboxConfig, setSandboxConfig] = useState<BattleConfig | null>(null);
  const [pvpRoom, setPvpRoom] = useState<{ roomId: string; side: 'left' | 'right'; arena: ArenaType; opponentName: string } | null>(null);
  const [raidBase, setRaidBase] = useState<SavedBase | null>(null);
  const [raidBattleToken, setRaidBattleToken] = useState<string | null>(null);

  const playerId = useMemo(() => getOrCreatePlayerId(), []);
  const playerName = `CMD-${playerId.slice(-4).toUpperCase()}`;

  useEffect(() => {
    authPlayer(playerId).catch(() => {});
  }, [playerId]);

  const persist = useCallback((next: SaveState) => { setSave(next); writeSave(next); }, []);

  const chapter = useMemo(
    () => CAMPAIGN.find((c) => c.id === activeChapter) ?? CAMPAIGN[0],
    [activeChapter],
  );

  if (screen === 'menu') {
    return (
      <MainMenu
        hasSave={hasSave}
        onStartCampaign={() => { persist(defaultSave()); setActiveChapter(0); setScreen('campaign'); }}
        onContinue={() => { setActiveChapter(save.currentChapter); setScreen('campaign'); }}
        onSandbox={() => setScreen('sandboxSetup')}
        onMultiplayer={() => setScreen('multiplayerMenu')}
      />
    );
  }

  if (screen === 'multiplayerMenu') {
    return (
      <MultiplayerMenu
        onPvP={() => setScreen('pvpLobby')}
        onEditBase={() => setScreen('baseEditor')}
        onRaid={() => setScreen('raidLobby')}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'pvpLobby') {
    return (
      <PvPLobby
        playerId={playerId}
        playerName={playerName}
        onMatchFound={(roomId, side, arena, opponentName) => {
          setPvpRoom({ roomId, side, arena, opponentName });
          setScreen('pvpBattle');
        }}
        onBack={() => setScreen('multiplayerMenu')}
      />
    );
  }

  if (screen === 'pvpBattle' && pvpRoom) {
    return (
      <PvPBattleScreen
        roomId={pvpRoom.roomId}
        side={pvpRoom.side}
        arena={pvpRoom.arena}
        opponentName={pvpRoom.opponentName}
        roster={save.roster}
        onEnd={() => setScreen('pvpLobby')}
      />
    );
  }

  if (screen === 'baseEditor') {
    return (
      <BaseEditor
        playerId={playerId}
        playerName={playerName}
        unlockedUnits={save.unlocked}
        onBack={() => setScreen('multiplayerMenu')}
      />
    );
  }

  if (screen === 'raidLobby') {
    return (
      <RaidLobby
        playerId={playerId}
        onRaid={(base, battleToken) => {
          setRaidBase(base);
          setRaidBattleToken(battleToken);
          setScreen('raidBattle');
        }}
        onBack={() => setScreen('multiplayerMenu')}
      />
    );
  }

  if (screen === 'raidBattle' && raidBase) {
    const raidConfig: BattleConfig = {
      arena: raidBase.arena,
      playerArmy: [],
      enemyArmy: raidBase.defense.flatMap(d =>
        Array.from({ length: d.count }, () => ({ type: d.type as UnitTypeId, level: d.level }))
      ),
      statScale: 1,
      multiLane: false,
      collisionZones: ARENA_COLLISION_ZONES[raidBase.arena],
      startingCP: 150,
      cpPerKill: 15,
      pendingDeployments: save.roster.flatMap(r =>
        Array.from({ length: r.count }, () => ({ type: r.type, level: r.level }))
      ),
    };
    return (
      <BattleScreen
        config={raidConfig}
        title={`Raiding ${raidBase.playerName}'s Base`}
        onEnd={(winner) => {
          if (raidBattleToken) {
            reportRaidResult(raidBase.id, winner === 'player', raidBattleToken).catch(() => {});
          }
          setScreen('raidLobby');
        }}
      />
    );
  }

  if (screen === 'campaign') {
    return (
      <CampaignMap
        save={save}
        onSelectChapter={(id) => { setActiveChapter(id); setScreen('preBattle'); }}
        onMenu={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'preBattle') {
    return (
      <PreBattle
        chapter={chapter}
        save={save}
        onBack={() => setScreen('campaign')}
        onUpdateRoster={(roster, gold) => persist({ ...save, roster, gold })}
        onLaunch={(playerArmy) => {
          const startingCP = 60 + chapter.id * 6;
          setBattleConfig({
            arena: chapter.arena,
            playerArmy: [],
            enemyArmy: chapter.enemies.flatMap((e) =>
              Array.from({ length: e.count }, () => ({ type: e.type, level: e.level ?? 1 }))
            ),
            statScale: chapter.statScale,
            multiLane: chapter.multiLane,
            collisionZones: ARENA_COLLISION_ZONES[chapter.arena],
            startingCP,
            cpPerKill: 12,
            pendingDeployments: playerArmy,
          });
          setScreen('battle');
        }}
      />
    );
  }

  if (screen === 'battle' && battleConfig) {
    return (
      <BattleScreen
        config={battleConfig}
        title={chapter.title}
        onEnd={(winner) => { setBattleResult(winner); setScreen('postBattle'); }}
      />
    );
  }

  if (screen === 'postBattle' && battleResult) {
    const isVictory = battleResult === 'player';
    const alreadyDone = save.completedChapters.includes(chapter.id);
    const goldEarned = isVictory && !alreadyDone ? chapter.reward : 0;
    const newUnlocks: UnitTypeId[] = isVictory && !alreadyDone ? chapter.unlocks ?? [] : [];
    const isLast = chapter.id === CAMPAIGN.length - 1;
    return (
      <PostBattle
        result={battleResult}
        chapter={chapter}
        goldEarned={goldEarned}
        newUnlocks={newUnlocks}
        save={save}
        onApplyRewards={() => {
          if (!isVictory) return save;
          const unlocked = [...save.unlocked, ...newUnlocks.filter(u => !save.unlocked.includes(u))];
          const roster: RosterEntry[] = [...save.roster];
          for (const u of newUnlocks) {
            if (!roster.find(r => r.type === u)) roster.push({ type: u, count: 1, level: 1 });
          }
          const nextChapter = alreadyDone ? save.currentChapter : Math.min(CAMPAIGN.length - 1, chapter.id + 1);
          const completed = alreadyDone ? save.completedChapters : [...save.completedChapters, chapter.id];
          const next: SaveState = { ...save, gold: save.gold + goldEarned, unlocked, roster, completedChapters: completed, currentChapter: nextChapter };
          persist(next);
          return next;
        }}
        onUpgrade={(roster, gold) => persist({ ...save, roster, gold })}
        onContinue={() => {
          if (isVictory && isLast && !alreadyDone) setScreen('ending');
          else if (isVictory) setScreen('campaign');
          else setScreen('preBattle');
        }}
      />
    );
  }

  if (screen === 'ending') return <Ending onMainMenu={() => setScreen('menu')} />;

  if (screen === 'sandboxSetup') {
    return (
      <SandboxSetup
        onBack={() => setScreen('menu')}
        onLaunch={(config) => { setSandboxConfig(config); setScreen('sandboxBattle'); }}
      />
    );
  }

  if (screen === 'sandboxBattle' && sandboxConfig) {
    return <BattleScreen config={sandboxConfig} title="Sandbox Skirmish" onEnd={() => setScreen('sandboxSetup')} />;
  }

  setScreen('menu');
  return null;
}
