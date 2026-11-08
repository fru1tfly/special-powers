import { useContext, useState, useRef, useEffect } from "react";
import { EditorContext, SetEditorContext } from "../EditorContext";
import { GameAudio } from "../../gameTypes/Audio";
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import * as Tone from 'tone';
import { AudioEffect } from "../../gameTypes/AudioEffects";
import AudioEffectMenu from "../AudioEffectMenu";

export default function AudioModal({ context, closeModal }) {
    const editorState = useContext(EditorContext);
    const setEditorState = useContext(SetEditorContext);

    const mediaElementRef = useRef(null);
    const toneSourceRef = useRef(null);

    const wavesurferRef = useRef(null);
    const regionsRef = useRef(null);
    const trimRegionRef = useRef(null);
    const loopPointRef = useRef(null);
    const effectNodesRef = useRef([]);

    const playPauseBtn = useRef(null);

    let existingAudio = null;
    if (context.level === 'song') {
        existingAudio = editorState.songs.find(s => s.id === editorState.selectedSong).audio;
    }

    const [wavesurferReady, setWavesurferReady] = useState(false);

    const [playing, setPlaying] = useState(false);
    const [level, setLevel] = useState(existingAudio?.level ?? 100);
    const [speed, setSpeed] = useState(existingAudio?.speed ?? 1);

    const [hasTrim, setHasTrim] = useState(existingAudio?.trimRegion ?? false);
    const [trimStart, setTrimStart] = useState(existingAudio?.trimRegion?.start ?? 0);
    const [trimEnd, setTrimEnd] = useState(existingAudio?.trimRegion?.end ?? 0);

    const [loop, setLoop] = useState(existingAudio?.loop ?? false);
    const [loopPoint, setLoopPoint] = useState(existingAudio?.loopPoint ?? 0);


    const [effects, setEffects] = useState([]);

    const handleKeyDown = (event) => {
        switch (event.key) {
            case ' ': {
                wavesurferRef.current.playPause();
                break;
            }
        }
    }

    const hasTrimRef = useRef(hasTrim);
    const loopRef = useRef(loop);
    const playingRef = useRef(playing);

    const audio = new GameAudio();
    audio.url = context.url;
    audio.level = level;
    audio.speed = speed;
    audio.loop = loop;
    
    if (hasTrim) {
        audio.trimRegion = {
            start: trimStart,
            end: trimEnd
        };
    }

    if (loop) {
        audio.loopPoint = loopPoint;
    }

    audio.effects = effects.map(eff => ({
        type: eff.type,
        params: eff.params,
        condition: eff.condition,
        rooms: eff.rooms ?? []
    }));


    useEffect(() => {
        hasTrimRef.current = hasTrim;
    }, [hasTrim]);

    useEffect(() => {
        loopRef.current = loop;
    }, [loop]);

    useEffect(() => {
        playingRef.current = playing;
    }, [playing]);

    useEffect(() => {

        const wavesurfer = WaveSurfer.create({
            container: '#waveform',
            url: `${import.meta.env.VITE_DOMAIN}${context.url}`,
            waveColor: '#807f80',
            progressColor: '#6e1010',
            barWidth: 1,
            barGap: -1,
            dragToSeek: true
        });

        if (existingAudio?.level) {
            wavesurfer.setVolume(parseInt(existingAudio?.level) / 100);
        }

        const eventDestructors = [];

        eventDestructors.push(wavesurfer.on('ready', async () => {
            const mediaElement = wavesurfer.getMediaElement();
            const context = Tone.getContext();

            const source = context.createMediaElementSource(mediaElement);
            toneSourceRef.current = source;

            const regions = wavesurfer.registerPlugin(RegionsPlugin.create());
            wavesurferRef.current = wavesurfer;

            if (existingAudio?.trimRegion) {
                trimRegionRef.current = regions.addRegion({
                    start: existingAudio.trimRegion.start,
                    end: existingAudio.trimRegion.end,
                    color: 'rgba(255, 255, 255, 0.5)',
                    drag: true,
                    resize: true,
                });
            }

            if (existingAudio?.loop) {
                loopPointRef.current = regions.addRegion({
                    start: existingAudio.loopPoint,
                    color: 'rgba(9, 141, 9, 0.8)',
                    drag: true,
                    content: 'Loop Point'
                })
            }

            eventDestructors.push(regions.on('region-out', (region) => {
                if (region === trimRegionRef.current) {
                    if (loopRef.current && playingRef.current) {
                        loopPointRef.current?.play();
                    } else if (playingRef.current) {
                        wavesurfer.pause();
                        wavesurfer.setTime(trimRegionRef.current.start);
                    }
                }
            }));

            eventDestructors.push(regions.on('region-updated', (region) => {
                if (region === trimRegionRef.current) {
                    setTrimStart(region.start);
                    setTrimEnd(region.end);
                }

                if (region === loopPointRef.current) {
                    setLoopPoint(region.start);
                }
            }));

            regionsRef.current = regions;

            if (existingAudio?.effects) {
                setEffects(existingAudio.effects.map(eff => {
                    const newEffect = new AudioEffect();
                    newEffect.params = {...eff.params};
                    newEffect.setType(eff.type, false);
                    newEffect.condition = eff.condition;
                    newEffect.rooms = eff.rooms ?? [];

                    return newEffect;
                }))
            }

            setWavesurferReady(true);
        }));

        eventDestructors.push(wavesurfer.on('play', () => setPlaying(true)));
        eventDestructors.push(wavesurfer.on('pause', () => setPlaying(false)));

        eventDestructors.push(wavesurfer.on('click', (relativeX) => {
            const dur = wavesurfer.getDuration();
            const time = relativeX * dur;
            if (hasTrimRef.current && time < trimRegionRef.current.start) {
                wavesurfer.setTime(trimRegionRef.current.start);
            }
            if (hasTrimRef.current && time > trimRegionRef.current.end) {
                wavesurfer.setTime(trimRegionRef.current.end);
            }
        }));

        eventDestructors.push(wavesurfer.on('finish', () => {
            if (loopRef.current) {
                loopPointRef.current?.play();
            }
        }));

        const stopSpace = (event) => event.preventDefault();
        playPauseBtn.current?.addEventListener('keydown', stopSpace);

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            eventDestructors.forEach(e => e());

            toneSourceRef.current?.disconnect();

            wavesurfer.destroy();

            wavesurferRef.current = null;
            regionsRef.current = null;

            window.removeEventListener('keydown', handleKeyDown);
            playPauseBtn.current?.removeEventListener('keydown', stopSpace);
        }
    }, []);

    useEffect(() => {
        if (!wavesurferReady) return;
        const source = toneSourceRef.current;
        if (!source) return;

        Tone.disconnect(source);

        effects.forEach((effect) => {
            effect.nodes.forEach((node) => Tone.disconnect(node));
        })

        if (effects.length === 0) {
            Tone.connect(source, Tone.getDestination());
        } else {
            // Connect the source through the effect nodes in order.
            let previousNode = source;

            effects.forEach((effect) => {
                effect.nodes.forEach((node) => {
                    Tone.connect(previousNode, node);
                    previousNode = node;
                });
            });

            // Route the final effect to the destination.
            Tone.connect(previousNode, Tone.getDestination());
        }

        return () => {
            Tone.disconnect(source);
        }

    }, [wavesurferReady, effects]);

    const addTrimRegion = () => {
        if (!hasTrim) {
            trimRegionRef.current = regionsRef.current.addRegion({
                start: 0,
                end: wavesurferRef.current.getDuration(),
                color: 'rgba(255, 255, 255, 0.5)',
                drag: true,
                resize: true,
            });
            setHasTrim(true);
            setTrimStart(0);
            setTrimEnd(wavesurferRef.current.getDuration());
        } else {
            trimRegionRef.current.remove();
            trimRegionRef.current = null;
            setHasTrim(false);
        }
    }

    const addLoopPoint = () => {
        if (!loop) {
            loopPointRef.current = regionsRef.current.addRegion({
                start: hasTrim ? trimRegionRef.current.start : 0,
                color: 'rgba(9, 141, 9, 0.8)',
                drag: true,
                content: 'Loop Point'
            });
            setLoop(true);
        } else {
            loopPointRef.current.remove();
            loopPointRef.current = null;
            setLoop(false);
        }
    }

    const playBtn = async () => {
        await Tone.start();

        wavesurferRef.current.setPlaybackRate(speed, false);

        if (
            trimRegionRef.current !== null && 
            (wavesurferRef.current.getCurrentTime() === trimRegionRef.current.end || 
            wavesurferRef.current.getCurrentTime() < trimRegionRef.current.start)
        ) {
            trimRegionRef.current.play(true);
            return;
        }

        wavesurferRef.current.playPause();
    }

    const seekStart = () => {
        if (hasTrim) {
            wavesurferRef.current.seekTo(
                trimRegionRef.current.start / wavesurferRef.current.getDuration()
            );
        } else {
            wavesurferRef.current.seekTo(0);
        }
    }

    const seekEnd = () => {
        if (hasTrim) {
            wavesurferRef.current.seekTo(
                trimRegionRef.current.end / wavesurferRef.current.getDuration()
            );
        } else {
            wavesurferRef.current.seekTo(1);
        }
    }

    const saveAudio = () => {
        if (context.level === 'song') {
            setEditorState({
                ...editorState,
                songs: editorState.songs.map(s => {
                    if (s.id === editorState.selectedSong) {
                        return {
                            ...s,
                            audio: audio
                        };
                    }

                    return s;
                })
            })
        }

        effects.forEach((effect) => {
            effect.nodes.forEach((node) => Tone.disconnect(node));
        })
        
        
        closeModal(audio);
    }

    const handleLevelChange = (event) => {
        wavesurferRef.current.setVolume(event.target.value / 100);
        setLevel(event.target.value);
    }

    const handleSpeedChange = (event) => {
        wavesurferRef.current.setPlaybackRate(event.target.value, false);
        setSpeed(event.target.value);
    }

    const handleAddEffect = (event) => {
        setEffects([...effects, new AudioEffect()]);
    }

    const updateEffect = (index, newEffect) => {
        setEffects(effects.map((eff, ind) => {
            if (ind === index) {
                return newEffect;
            }
            return eff;
        }));
    }

    const effectUp = (index) => {
        const tempEffects = [...effects];
        const tempEff = tempEffects[index - 1];
        tempEffects[index - 1] = tempEffects[index];
        tempEffects[index] = tempEff;

        setEffects([...tempEffects]);
    }

    const effectDown = (index) => {
        const tempEffects = [...effects];
        const tempEff = tempEffects[index + 1];
        tempEffects[index + 1] = tempEffects[index];
        tempEffects[index] = tempEff;

        setEffects([...tempEffects]);
    }

    const effectDelete = (index) => {
        const tempEffects = [...effects];
        tempEffects.splice(index, 1);
        setEffects([...tempEffects]);
    }

    return  (
        <div className="editor-modal anim-modal">
            <div className="modal-body">
                <div id="waveform"></div>
                <div className="btn-row">
                    <div onClick={seekStart} className="div-btn audio-btn">⏮</div>
                    <div 
                        ref={playPauseBtn} 
                        className={'div-btn audio-btn' + (playing ? ' active-btn' : '')} 
                        onClick={playBtn}
                    >
                        {playing ? '⏸' : '►'}
                    </div>
                    <div onClick={seekEnd} className="div-btn audio-btn">⏭</div>
                    <button onClick={addTrimRegion} className={hasTrim ? 'active-btn' : ''}>Trim</button>
                    <button onClick={addLoopPoint} className={loop ? 'active-btn' : ''}>Loop</button>
                </div>
                <div className="audio-row">
                    <div className="audio-effect-container">
                        <div className="modal-field-label effect-title">
                            Effects
                            <button className="action-btn" onClick={handleAddEffect}>New Effect</button>
                        </div>
                        <div className="effect-section">
                            <div className="effects-scroll">
                                {effects.map((eff, ind) => 
                                    <AudioEffectMenu 
                                        effect={eff} 
                                        update={(newEff) => updateEffect(ind, newEff)}
                                        index={ind}
                                        count={effects.length}
                                        increase={effectUp}
                                        decrease={effectDown}
                                        remove={effectDelete}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="fader">
                        <label className="modal-field-label" for="speed">Speed</label>
                        <input 
                            type="range" 
                            id="speed"
                            value={speed} 
                            min={0.1} 
                            max={2} 
                            step={0.05} 
                            onChange={handleSpeedChange}
                        />
                    </div>
                    <div className="fader">
                        <label className="modal-field-label" for="master">Master</label>
                        <input 
                            type="range" 
                            id="master"
                            value={level} 
                            min={0} 
                            max={100} 
                            step={1} 
                            onChange={handleLevelChange}
                        />
                    </div>
                </div>
            </div>
            <div className="modal-footer">
                <button className="modal-footer-button action-btn" onClick={saveAudio}>Done</button>
            </div>
        </div>
    );
}