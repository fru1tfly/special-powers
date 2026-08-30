import { EditorContext, SetEditorContext } from './EditorContext';
import { useContext, useEffect, useRef, useState } from 'react';
import { useUploadFile } from '../hooks/files/useUploadFile';
import { useGetInteractable, useUpdateInteractable } from "../hooks/editor/InteractableHelper";
import AnimationCanvas from './AnimationCanvas';
import { Animation } from '../gameTypes/LevelObjects';
import { addImage } from '../gameData/images';

export default function AnimationModal({ animatedField, closeModal }) {
    const editorState = useContext(EditorContext);
    const setEditorState = useContext(SetEditorContext);

    const selectedRoom = editorState.rooms.find(r => r.id === editorState.selectedRoom);
    const selectedInteractable = useGetInteractable();
    const updateInteractable = useUpdateInteractable();

    const existingAnimation = selectedInteractable[animatedField];

    const [playing, setPlaying] = useState(false);
    const [selectedFrame, setSelectedFrame] = useState(0);
    const [frameRate, setFrameRate] = useState(existingAnimation?.frameRate ?? 10);
    const [entryPoint, setEntryPoint] = useState('end');
    const [loopMode, setLoopMode] = useState(existingAnimation?.loopMode ?? 'loop');
    const [loopTimes, setLoopTimes] = useState(existingAnimation?.timesToPlay ?? 1);

    const { uploadFile } = useUploadFile();

    const frameRefs = useRef([]);

    const animation = useRef(new Animation()).current;
    animation.frames = [...selectedInteractable.assets];
    animation.frameRate = frameRate;
    animation.loopMode = loopMode;
    animation.timesToPlay = loopTimes;
    if (!playing) {
        animation.currentFrame = selectedFrame;
    }


    useEffect(() => {
        frameRefs.current[selectedFrame]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }, [selectedFrame]);

    useEffect(() => {

        const unsubscribe = animation.on('end', () => {
            setPlaying(false);
        });

        return unsubscribe;
    }, [animation])


    const uploadMulti = async (event) => {
        const files = Array.from(event.target.files);

        const newUrls = await Promise.all(files.map(async (file) => {
            const newUrl = await uploadFile(file, '/images/sprites');
            console.log(newUrl);
            return newUrl;
        }));
        console.log(newUrls);

        await Promise.all(newUrls.map(url => addImage(url)));

        if (entryPoint === 'end') {
            updateInteractable({
                ...selectedInteractable,
                assets: [ 
                    ...selectedInteractable.assets,
                    ...newUrls
                ]
            });
        } else if (entryPoint === 'selected') {
            updateInteractable({
                ...selectedInteractable,
                assets: [ 
                    ...selectedInteractable.assets.slice(0, selectedFrame + 1),
                    ...newUrls,
                    ...selectedInteractable.assets.slice(selectedFrame + 1)
                ]
            });
        }
    }

    const startPlaying = () => {
        if (loopMode === 'once' || loopMode === 'x') {
            animation.currentFrame = 0;
        } else {
            animation.currentFrame = selectedFrame;
        }
        setPlaying(true);
    }

    const stopPlaying = () => {
        setPlaying(false);
        setSelectedFrame(animation.currentFrame);
    }

    const handleFrameRateChange = (event) => {
        setFrameRate(event.target.value);
    }

    const handleEntryPointChange = (event) => {
        setEntryPoint(event.target.value);
    }

    const decreaseSelectedFrame = () => {
        let newSelectedFrame = selectedFrame - 1;
        if (newSelectedFrame < 0) {
            newSelectedFrame = selectedInteractable.assets.length - 1;
        }

        setSelectedFrame(newSelectedFrame);
    }

    const increaseSelectedFrame = () => {
        let newSelectedFrame = selectedFrame + 1;
        if (newSelectedFrame > selectedInteractable.assets.length - 1) {
            newSelectedFrame = 0;
        }

        setSelectedFrame(newSelectedFrame);
    }

    const deleteFrame = () => {
        const tempAssets = [...selectedInteractable.assets];
        tempAssets.splice(selectedFrame, 1);
        updateInteractable({
            ...selectedInteractable,
            assets: [...tempAssets]
        });

        if (selectedFrame > tempAssets.length - 1) {
            setSelectedFrame(tempAssets.length - 1);
        }
    }

    const handleLoopModeChange = (event) => {
        setLoopMode(event.target.value);
    }

    const handleLoopTimesChange = (event) => {
        setLoopTimes(event.target.value);
    }

    const saveAnimation = () => {
        updateInteractable({
            ...selectedInteractable,
            [animatedField]: animation
        });
        closeModal();
    }

    return  (
        <div className="editor-modal anim-modal">
            <div className="modal-body">
                <div className="modal-section frame-row">
                    <button onClick={decreaseSelectedFrame} className={playing ? 'disabled-btn' : ''}>⬅</button>
                    {!playing &&
                        <div className="frame-marker-container">
                            {animation.frames.map(
                                (f, ind) => (
                                    <div
                                        key={ind}
                                        ref={el => {
                                            frameRefs.current[ind] = el;
                                        }} 
                                        className={
                                            ind === selectedFrame 
                                                ? 'frame-marker frame-marker-selected' 
                                                : 'frame-marker'
                                        }
                                    >
                                        {ind + 1}
                                    </div>
                                )
                            )}
                        </div>
                    }
                    {playing &&
                        <div className="frame-marker-container">
                            {animation.frames.map(
                                (f, ind) => (
                                    <div className="frame-marker disabled-btn">{ind + 1}</div>
                                )
                            )}
                        </div>
                    }
                    <button className={playing ? 'text-flip disabled-btn' : 'text-flip'} onClick={increaseSelectedFrame}>⬅</button>
                </div>
                <div className="modal-section">
                    <div className="modal-field">
                        <label htmlFor="sprite" className="uploadLabel action-btn">Add Frame(s)</label>
                        <input type="file" accept="image/*" onChange={uploadMulti} id="sprite" multiple />
                    </div>
                    <div className="modal-field">
                        <select onChange={handleEntryPointChange}>
                            <option value="end">At the End</option>
                            <option value="selected">After Frame {selectedFrame + 1}</option>
                        </select>
                    </div>
                </div>
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Frame Rate (FPS)</div>
                        <input type="number" value={frameRate} onChange={handleFrameRateChange} max={120} min={0.1}/>
                    </div>
                    <div className="modal-field">
                        <div className="modal-field-label">Play Mode</div>
                        <select onChange={handleLoopModeChange} value={loopMode}>
                            <option value="loop">Loop</option>
                            <option value="once">Play Once</option>
                            <option value="boom">Boomerang</option>
                            <option value="x">Play X Times</option>
                        </select>
                        {loopMode === 'x' && 
                            <>
                                <div className="modal-field-label"># of Times</div>
                                <input type="number" value={loopTimes} onChange={handleLoopTimesChange} step={1} min={1}/>
                            </>
                        }
                    </div>
                </div>
                <AnimationCanvas 
                    anim={animation}
                    playing={playing}
                ></AnimationCanvas>
            </div>
            <div className="modal-footer">
                {!playing && 
                    <button className="modal-footer-button action-btn" onClick={startPlaying}>Play</button>
                }
                {playing &&
                    <button className="modal-footer-button" onClick={stopPlaying}>Stop</button>
                }
                <button onClick={deleteFrame} className={playing ? 'modal-footer-button disabled-btn' : 'modal-footer-button'}>Delete Frame</button>
                <button className="modal-footer-button action-btn" onClick={saveAnimation}>Done</button>
            </div>
        </div>
    );
}
