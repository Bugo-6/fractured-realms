import React, { useCallback, useMemo, useState } from 'react';
import type { BattleConfig, RosterEntry, SaveState, UnitTypeId } from './game/types';
import { CAMPAIGN } from './game/campaign';
import { defaultSave, loadSave, writeSave } from './game/campaign';
import { ARENA_COLLISION_ZONES } from './game/arenaBuilder';

import { MainMenu } from './screens/MainMenu';
import { CampaignMap } from './screens/CampaignMap';
import { PreBattle } from './screens/PreBattle';
import { BattleScreen } from './screens/BattleScreen';
import { PostBattle } from './screens/PostBattle';
import { Ending } from './screens/Ending';
import { SandboxSetup } from './screens/SandboxSetup';

type Screen =
  | 'menu'
  | 'campaign'
  | 'preBattle'
  | 'battle'
  | 'postBattle'
  | 'ending'
  | 'sandboxSetup'
  | 'sandboxBattle';

export default function App() {
  const [save, setSave] = useState<SaveState>(() => loadSave() ?? defaultSave());
  const [hasSave] = useState<boolean>(() => loadSave() !== null);
  const [screen, setScreen] = useState<Screen>('menu');
  const [activeChapter, setActiveChapter] = useState<number>(save.currentChapter);
  const [battleConfig, setBattleConfig] = useState<BattleConfig | null>(null);
  const [battleResult, setBattleResult] = useState<'player' | 'enemy' | null>(null);
  const [sandboxConfig, setSandboxConfig] = useState<BattleConfig | null>(null);

  const persist = useCallback((next: SaveState) => {
    setSave(next);
    writeSave(next);
  }, []);

  const chapter = useMemo(
    () => CAMPAIGN.find((c) => c.id === activeChapter) ?? CAMPAIGN[0],
    [activeChapter],
  );

  // ---- Menu ----
  if (screen === 'menu') {
    return (
      <MainMenu
        hasSave={hasSave}
        onStartCampaign={() => {
          const fresh = defaultSave();
          persist(fresh);
          setActiveChapter(0);
          setScreen('campaign');
        }}
        onContinue={() => {
          setActiveChapter(save.currentChapter);
          setScreen('campaign');
        }}
        onSandbox={() => setScreen('sandboxSetup')}
      />
    );
  }

  // ---- Campaign map ----
  if (screen === 'campaign') {
    return (
      <CampaignMap
        save={save}
        onSelectChapter={(id) => {
          setActiveChapter(id);
          setScreen('preBattle');
        }}
        onMenu={() => setScreen('menu')}
      />
    );
  }

  // ---- Pre-battle: story + army builder ----
  if (screen === 'preBattle') {
    return (
      <PreBattle
        chapter={chapter}
        save={save}
        onBack={() => setScreen('campaign')}
        onUpdateRoster={(roster, gold) => persist({ ...save, roster, gold })}
        onLaunch={(playerArmy) => {
          // CP scales gently with chapter; the player army becomes the
          // deployment pool that is fed onto the field during battle.
          const startingCP = 60 + chapter.id * 6;
          setBattleConfig({
            arena: chapter.arena,
            playerArmy: [], // player units are deployed during battle via CP
            enemyArmy: chapter.enemies.flatMap((e) =>
              Array.from({ length: e.count }, () => ({
                type: e.type,
                level: e.level ?? 1,
              })),
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

  // ---- Battle ----
  if (screen === 'battle' && battleConfig) {
    return (
      <BattleScreen
        config={battleConfig}
        title={chapter.title}
        onEnd={(winner) => {
          setBattleResult(winner);
          setScreen('postBattle');
        }}
      />
    );
  }

  // ---- Post-battle ----
  if (screen === 'postBattle' && battleResult) {
    const isVictory = battleResult === 'player';
    const alreadyDone = save.completedChapters.includes(chapter.id);
    const goldEarned = isVictory && !alreadyDone ? chapter.reward : 0;
    const newUnlocks: UnitTypeId[] =
      isVictory && !alreadyDone ? chapter.unlocks ?? [] : [];
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
          const unlocked = [
            ...save.unlocked,
            ...newUnlocks.filter((u) => !save.unlocked.includes(u)),
          ];
          // grant one free copy of each newly unlocked unit
          const roster: RosterEntry[] = [...save.roster];
          for (const u of newUnlocks) {
            if (!roster.find((r) => r.type === u)) {
              roster.push({ type: u, count: 1, level: 1 });
            }
          }
          const nextChapter = alreadyDone
            ? save.currentChapter
            : Math.min(CAMPAIGN.length - 1, chapter.id + 1);
          const completed = alreadyDone
            ? save.completedChapters
            : [...save.completedChapters, chapter.id];
          const next: SaveState = {
            ...save,
            gold: save.gold + goldEarned,
            unlocked,
            roster,
            completedChapters: completed,
            currentChapter: nextChapter,
          };
          persist(next);
          return next;
        }}
        onUpgrade={(roster, gold) => persist({ ...save, roster, gold })}
        onContinue={() => {
          if (isVictory && isLast && !alreadyDone) {
            setScreen('ending');
          } else if (isVictory) {
            setScreen('campaign');
          } else {
            setScreen('preBattle');
          }
        }}
      />
    );
  }

  // ---- Ending ----
  if (screen === 'ending') {
    return (
      <Ending
        onMainMenu={() => {
          setScreen('menu');
        }}
      />
    );
  }

  // ---- Sandbox setup ----
  if (screen === 'sandboxSetup') {
    return (
      <SandboxSetup
        onBack={() => setScreen('menu')}
        onLaunch={(config) => {
          setSandboxConfig(config);
          setScreen('sandboxBattle');
        }}
      />
    );
  }

  // ---- Sandbox battle ----
  if (screen === 'sandboxBattle' && sandboxConfig) {
    return (
      <BattleScreen
        config={sandboxConfig}
        title="Sandbox Skirmish"
        onEnd={() => setScreen('sandboxSetup')}
      />
    );
  }

  // Fallback
  setScreen('menu');
  return null;
}
