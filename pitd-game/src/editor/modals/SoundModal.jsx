import { useContext, useState } from "react";
import { EditorContext, SetEditorContext } from "../EditorContext";
import { useGetInteractable, useUpdateInteractable } from "../../hooks/editor/InteractableHelper";
import { GameAudio } from "../../gameTypes/Audio";
import { Sound } from "../../gameTypes/LevelObjects";
import FileModal from "./FileModal";
import { addAudio } from "../../gameData/assetManager";
import AudioModal from "./AudioModal";
import AudioPreview from "../AudioPreview";

export default function SoundModal({ soundField, closeModal }) {
    const editorState = useContext(EditorContext);
    const setEditorState = useContext(SetEditorContext);

    const selectedRoom = editorState.rooms.find(r => r.id === editorState.selectedRoom);
    const selectedInteractable = useGetInteractable();
    const updateInteractable = useUpdateInteractable();

    const existingSound = selectedInteractable[soundField] ?? new Sound();

    const [audio, setAudio] = useState(existingSound.audio ? {...existingSound.audio} : new GameAudio());
    const [name, setName] = useState(existingSound.name ?? 'New Sound');

    const [fadeInTime, setFadeInTime] = useState(existingSound.fadeInTime ?? 0);
    const [fadeOutTime, setFadeOutTime] = useState(existingSound.fadeOutTime ?? 0);

    const [behavior, setBehavior] = useState(existingSound.behavior ?? 'overlap');
    const [reduction, setReduction] = useState(existingSound.reduction ?? 0);

    const [fileMode, setFileMode] = useState(false);
    const [audioMode, setAudioMode] = useState(false);

    const handleNameChange = (event) => {
        setName(event.target.value);
        updateSound({ name: event.target.value });
    }

    const handleReductionChange = (event) => {
        let val = event.target.value;
        if (val < 0) {
            val = 0;
        }

        if (val > 100) {
            val = 100;
        }
        setReduction(val);
        updateSound({ reduction: val });
    }
    
    const handleBehaviorChange = (event) => {
        setBehavior(event.target.value);
        updateSound({ behavior: event.target.value });
    }

    const handleFadeInTimeChange = (event) => {
        let val = event.target.value;
        if (val < 0) {
            val = 0;
        }

        if (val > 10) {
            val = 10;
        }

        setFadeInTime(val);
        updateSound({ fadeInTime: val });
    }

    const handleFadeOutTimeChange = (event) => {
        let val = event.target.value;
        if (val < 0) {
            val = 0;
        }

        if (val > 10) {
            val = 10;
        }

        setFadeOutTime(val);
        updateSound({ fadeOutTime: val });
    }

    const handleFileMode = () => {
        setFileMode(true);
    }

    const handleEditAudio = () => {
        setAudioMode(true);
    }

    const handleAudioUpdate = (newUrl) => {
        if (!Array.isArray(newUrl)) {
            const newAudio = {
                ...audio,
                url: newUrl
            };

            setAudio(newAudio);
            updateSound({ audio: newAudio });
        }

        setFileMode(false);
    }

    const updateSound = (overrides = {}) => {
        updateInteractable({
            ...selectedInteractable,
            [soundField]: {
                ...existingSound,
                name,
                audio,
                reduction,
                fadeInTime,
                fadeOutTime,
                ...overrides
            }
        });
    }

    const saveSound = () => {
        updateSound();
        closeModal();
    }

    const hasAudio = existingSound && existingSound.audio && existingSound.audio.url;

    return audioMode ? (
        <AudioModal
            context={{
                url: audio.url,
                level: 'sound',
                roomId: editorState.selectedRoom,
                interactableId: selectedInteractable.id,
                field: soundField
            }}
            closeModal={(newAudio) => {
                setAudio(newAudio);
                updateSound({ audio: newAudio });
                setAudioMode(false);
            }}
        />
    ) : fileMode ? (
        <FileModal
            fileType="audio"
            multi={false}
            addFiles={handleAudioUpdate}
        />
    ) : (
        <div className="editor-modal tall-modal">
            <div className="modal-body">
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Name</div>
                        <input type="text" value={name} onInput={handleNameChange}/>
                    </div>
                    <div className="modal-field">
                        <div className="modal-field-label">Audio</div>
                        {hasAudio && 
                            <>
                                <AudioPreview audio={audio} />
                                <div className="modal-footer">
                                    <button className="modal-footer-button" onClick={handleFileMode}>Change Sound</button>
                                    <button className="modal-footer-button action-btn" onClick={() => handleEditAudio()}>Edit Audio</button>
                                </div>
                            </>
                        }
                        {!hasAudio &&
                            <>
                                <button onClick={handleFileMode}>Select Sound</button>
                            </>
                        }
                    </div>
                </div>
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Fade In Time (in seconds)</div>
                        <input type="number" min={0} max={10} onInput={handleFadeInTimeChange} value={fadeInTime}/>
                    </div>
                    <div className="modal-field">
                        <div className="modal-field-label">Fade Out Time (in seconds)</div>
                        <input type="number" min={0} max={10} onInput={handleFadeOutTimeChange} value={fadeOutTime}/>
                    </div>
                </div>
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Play Behavior</div>
                        <select value={behavior} onChange={handleBehaviorChange}>
                            <option value="overlap">Play On Top</option>
                            <option value="replace">Replace</option>
                        </select>
                    </div>
                    
                    {behavior === 'overlap' && 
                        <div className="modal-field">
                            <div className="modal-field-label">% to Reduce Existing Audio</div>
                            <input type="number" min={0} max={99} step={1} onInput={handleReductionChange} value={reduction}/>
                        </div>
                    }
                </div>
            </div>

            <div className="modal-footer">
                <button className="modal-footer-button action-btn" onClick={saveSound}>Done</button>
            </div>
        </div>
    );
}