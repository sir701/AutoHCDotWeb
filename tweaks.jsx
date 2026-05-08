/* Tweaks panel for AutoHC Cinematic */
const { useEffect } = React;

function AutoHCTweaks(){
  const defaults = window.__TWEAKS__ || { grain: true, cursor: true, accent: 'blue' };
  const [t, setTweak] = useTweaks(defaults);

  useEffect(() => {
    document.body.dataset.grain = t.grain ? 'on' : 'off';
  }, [t.grain]);
  useEffect(() => {
    document.body.dataset.cursor = t.cursor ? 'on' : 'off';
  }, [t.cursor]);
  useEffect(() => {
    document.body.dataset.accent = t.accent;
    if (window.applyAccent) window.applyAccent(t.accent);
  }, [t.accent]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection title="Cinematic effects">
        <TweakToggle label="Film grain overlay" value={t.grain} onChange={v => setTweak('grain', v)} />
        <TweakToggle label="Custom cursor" value={t.cursor} onChange={v => setTweak('cursor', v)} />
      </TweakSection>
      <TweakSection title="Accent palette">
        <TweakRadio
          label="Brand accent"
          value={t.accent}
          options={[
            { value: 'blue',  label: 'Blue' },
            { value: 'olive', label: 'Olive' },
            { value: 'ink',   label: 'Ink' },
          ]}
          onChange={v => setTweak('accent', v)}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

const tweaksRoot = document.createElement('div');
document.body.appendChild(tweaksRoot);
ReactDOM.createRoot(tweaksRoot).render(<AutoHCTweaks />);
