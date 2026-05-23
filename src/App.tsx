import React, { useState, useCallback } from 'react';
import { GameState, ArmyComp, UnitClassId } from './game/types';
import { CHAPTERS, STARTER_ARMY, STARTING_GOLD, INITIALLY_UNLOCKED } from './game/campaign';

import { MainMenu }     from './screens/MainMenu';
import { CampaignMap }  from './screens/CampaignMap';
import { PreBattle }    from './screens/PreBattle';
import { BattleScreen } from './screens/BattleScreen';
import { PostBattle }   from './screens/PostBattle';
import { SandboxSetup } from './screens/SandboxSetup';
import { Ending }       from './screens/Ending';

const SAVE_KEY = 'fractured_realms_save';

function loadSave(): Partial<GameState> | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveToDisk(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      gold: state.gold,
      currentChapter: state.currentChapter,
      completedChapters: state.completedChapters,
      unlockedUnits: state.unlockedUnits,
      playerArmy: state.playerArmy,
    }));
  } catch { /* ignore */ }
}

function freshState(): GameState {
  return {
    screen: 'menu',
    gold: STARTING_GOLD,
    currentChapter: 1,
    completedChapters: [],
    unlockedUnits: [...INITIALLY_UNLOCKED],
    playerArmy: [...STARTER_ARMY],
    lastBattleResult: null,
    sandboxPlayerArmy: [{ classId: 'knight', count: 20 }],
    sandboxEnemyArmy: [{ classId: 'orc', count: 30 }],
    speedMultiplier: 1,
  };
}

function loadedState(save: Partial<GameState>): GameState {
  return { ...freshState(), ...save, screen: 'menu', lastBattleResult: null };
}

export default function App() {
  const save = loadSave();
  const [gs, setGs] = useState<GameState>(() => save ? loadedState(save) : freshState());

  const go = useCallback((patch: Partial<GameState>) => {
    setGs(prev => {
      const next = { ...prev, ...patch };
      if (patch.screen !== 'menu' && patch.screen !== 'battle' && patch.screen !== 'sandbox-battle') {
        saveToDisk(next);
      }
      return next;
    });
  }, []);

  const chapter = CHAPTERS.find(c => c.id === gs.currentChapter) ?? CHAPTERS[0];

  // ── SCREENS ───────────────────────────────────────────────────────────────

  if (gs.screen === 'menu') {
    return (
      <MainMenu
        hasSave={!!save}
        onNewGame={() => {
          localStorage.removeItem(SAVE_KEY);
          setGs(freshState());
        }}
        onContinue={() => go({ screen: 'campaign' })}
        onSandbox={() => go({ screen: 'sandbox-setup' })}
      />
    );
  }

  if (gs.screen === 'campaign') {
    return (
      <CampaignMap
        completedChapters={gs.completedChapters}
        currentChapter={gs.currentChapter}
        gold={gs.gold}
        onSelectChapter={id => go({ currentChapter: id, screen: 'pre-battle' })}
        onMenu={() => go({ screen: 'menu' })}
      />
    );
  }

  if (gs.screen === 'pre-battle') {
    return (
      <PreBattle
        chapter={chapter}
        gold={gs.gold}
        unlockedUnits={gs.unlockedUnits}
        initialArmy={gs.playerArmy}
        onBack={() => go({ screen: 'campaign' })}
        onBattle={army => go({ playerArmy: army, screen: 'battle' })}
      />
    );
  }

  if (gs.screen === 'battle') {
    return (
      <BattleScreen
        playerArmy={gs.playerArmy}
        enemyArmy={chapter.enemyArmy}
        chapterTitle={chapter.title}
        terrain={chapter.terrain}
        onEnd={result => go({ lastBattleResult: result, screen: 'post-battle' })}
      />
    );
  }

  if (gs.screen === 'post-battle' && gs.lastBattleResult) {
    const isVictory = gs.lastBattleResult === 'victory';
    const alreadyDone = gs.completedChapters.includes(chapter.id);
    const newUnlocks = isVictory && !alreadyDone ? chapter.unlocks : [];
    const goldEarned = isVictory && !alreadyDone ? chapter.reward : 0;

    return (
      <PostBattle
        result={gs.lastBattleResult}
        chapter={chapter}
        goldEarned={goldEarned}
        newUnlocks={newUnlocks as UnitClassId[]}
        isLastChapter={chapter.id === CHAPTERS.length}
        onContinue={() => {
          if (!isVictory) {
            go({ screen: 'pre-battle' });
            return;
          }
          if (chapter.id === CHAPTERS.length) {
            go({ screen: 'ending' as any });
            return;
          }
          const nextChapter = chapter.id + 1;
          const updatedCompleted = alreadyDone
            ? gs.completedChapters
            : [...gs.completedChapters, chapter.id];
          const updatedUnlocks = [
            ...gs.unlockedUnits,
            ...(newUnlocks as UnitClassId[]).filter(u => !gs.unlockedUnits.includes(u)),
          ];
          go({
            screen: 'campaign',
            completedChapters: updatedCompleted,
            currentChapter: nextChapter,
            gold: gs.gold + goldEarned,
            unlockedUnits: updatedUnlocks,
          });
        }}
      />
    );
  }

  if ((gs.screen as string) === 'ending') {
    return <Ending onMainMenu={() => { localStorage.removeItem(SAVE_KEY); setGs(freshState()); }} />;
  }

  if (gs.screen === 'sandbox-setup') {
    return (
      <SandboxSetup
        onBack={() => go({ screen: 'menu' })}
        onBattle={(playerArmy, enemyArmy) =>
          go({ sandboxPlayerArmy: playerArmy, sandboxEnemyArmy: enemyArmy, screen: 'sandbox-battle' })
        }
      />
    );
  }

  if (gs.screen === 'sandbox-battle') {
    return (
      <BattleScreen
        playerArmy={gs.sandboxPlayerArmy}
        enemyArmy={gs.sandboxEnemyArmy}
        chapterTitle="Sandbox Battle"
        terrain="hills"
        onEnd={() => go({ screen: 'sandbox-setup' })}
      />
    );
  }

  return null;
}
