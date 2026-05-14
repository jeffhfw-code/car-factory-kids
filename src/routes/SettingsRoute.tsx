import { ScreenContainer } from '../ui/ScreenContainer';
import { useGameStore } from '../state/gameStore';

export default function SettingsRoute() {
  const settings = useGameStore((s) => s.settings);
  return (
    <ScreenContainer
      title="Settings"
      subtitle="Audio, narration, and reset progress coming soon"
    >
      <ul style={{ paddingLeft: 'var(--space-lg)', lineHeight: 1.6 }}>
        <li>Sound effects: {settings.soundEffects ? 'on' : 'off'}</li>
        <li>Music: {settings.music ? 'on' : 'off'}</li>
        <li>Narration: {settings.narration ? 'on' : 'off'}</li>
      </ul>
    </ScreenContainer>
  );
}
