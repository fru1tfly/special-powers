import { useCallback, useEffect, useRef, useState } from "react";
import { Tone } from "../../gameData/assetManager";
import { AudioEffect } from "../../gameTypes/AudioEffects";

const mediaSources = new WeakMap();

const getMediaSource = (tone, element) => {
    let source = mediaSources.get(element);
    if (!source) {
        source = tone.getContext().createMediaElementSource(element);
        mediaSources.set(element, source);
    }
    return source;
};

const buildEffects = (savedEffects = []) => savedEffects.map(saved => {
    const effect = new AudioEffect();
    effect.params = { ...saved.params };
    effect.condition = saved.condition;
    effect.rooms = saved.rooms ?? [];
    effect.setType(saved.type, false);
    return effect;
});

export function useAudioEffects(gameAudio) {
    const elementRef = useRef(null);
    const [element, setElement] = useState(null);

    const ref = useCallback((node) => {
        elementRef.current = node;
        setElement(node);
    }, []);

    const effectsKey = JSON.stringify((gameAudio?.effects ?? []).map(eff => ({
        type: eff.type,
        params: eff.params,
        condition: eff.condition,
        rooms: eff.rooms ?? []
    })));

    const level = gameAudio?.level ?? 100;
    const speed = gameAudio?.speed ?? 1;

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const applyRate = () => {
            element.preservesPitch = false;
            element.playbackRate = parseFloat(speed) || 1;
        };

        applyRate();

        element.defaultPlaybackRate = parseFloat(speed) || 1;
        element.addEventListener('loadedmetadata', applyRate);

        return () => element.removeEventListener('loadedmetadata', applyRate);
    }, [element, speed]);

    useEffect(() => {
        const element = elementRef.current;
        const tone = Tone();

        if (!element || !tone) return;

        let cancelled = false;
        const source = getMediaSource(tone, element);
        const effects = buildEffects(JSON.parse(effectsKey));

        let levelValue = parseInt(level);
        if (isNaN(levelValue)) levelValue = 100;
        const levelNode = new tone.Gain(levelValue / 100);

        const connectChain = async () => {
            await Promise.all(
                effects.flatMap(eff => eff.nodes).map(node => node.ready).filter(Boolean)
            );

            if (cancelled) return;

            source.disconnect();
            let previousNode = source;

            effects.forEach(effect => {
                if (effect.condition === 'off') return;

                effect.nodes.forEach(node => {
                    tone.connect(previousNode, node);
                    previousNode = node;
                });
            });
            tone.connect(previousNode, levelNode);
        };

        tone.connect(levelNode, tone.getDestination());

        source.disconnect();
        tone.connect(source, levelNode);
        connectChain();

        return () => {
            cancelled = true;
            source.disconnect();
            effects.forEach(eff => eff.nodes.forEach(node => node.dispose()));
            levelNode.dispose();
        };
    }, [element, effectsKey, level]);

    return ref;
}
