import { useContext, useRef, useState, useEffect } from "react";
import { EditorContext, SetEditorContext } from "../EditorContext";
import AudioModal from "./AudioModal";
import { GameAudio } from "../../gameTypes/Audio";
import { addAudio } from "../../gameData/assetManager";
import { useUploadFile } from "../../hooks/files/useUploadFile";
import { Song } from "../../gameTypes/LevelObjects";
import Multipicker from "../Multipicker";

export default function SongModal({ song, closeModal }) {
    const editorState = useContext(EditorContext);
    const setEditorState = useContext(SetEditorContext);
    const existingSong = editorState.songs.find(s => s.id === song);

    const { uploadFile } = useUploadFile();

    useEffect(() => {
        if (existingSong.audio) setAudio(existingSong.audio);
        if (existingSong.name) setName(existingSong.name);
        if (existingSong.rooms) setSongRooms(existingSong.rooms);
        if (existingSong.startCondition) setStartCondition(existingSong.startCondition);
        if (existingSong.behavior) setBehavior(existingSong.behavior);
        if (existingSong.fadeTime) setFadeTime(existingSong.fadeTime);
        if (existingSong.reduction) setFadeTime(existingSong.reduction);
    }, [song]);

    const [audio, setAudio] = useState({...existingSong.audio} ?? new GameAudio());
    const [name, setName] = useState(existingSong.name ?? 'New Song');
    const [songRooms, setSongRooms] = useState(existingSong.rooms ?? []);
    const [startCondition, setStartCondition] = useState(existingSong.startCondition ?? 'room');
    const [behavior, setBehavior] = useState(existingSong.behavior ?? 'overlap');
    const [fadeTime, setFadeTime] = useState(existingSong.fadeTime ?? 0);
    const [reduction, setReduction] = useState(existingSong.reduction ?? 0);

    const [audioMode, setAudioMode] = useState(false);


    const handleNameChange = (event) => {
        setName(event.target.value);
        updateSong();
    }

    const handleConditionChange = (event) => {
        setStartCondition(event.target.value);
        updateSong();
    }

    const handleBehaviorChange = (event) => {
        setBehavior(event.target.value);
        updateSong();
    }

    const handleReductionChange = (event) => {
        let val = event.target.value;
        if (val < 0) {
            val = 0;
        }

        if (val > 99) {
            val = 99;
        }
        setReduction(val);
        updateSong();
    }

    const handleFadeTimeChange = (event) => {
        let val = event.target.value;
        if (val < 0) {
            val = 0;
        }

        if (val > 10) {
            val = 10;
        }

        setFadeTime(val);
        updateSong();
    }

    const handleEditAudio = () => {
        setAudioMode(true);
    }

    const hasAudio = existingSong.audio !== undefined;

    const uploadAudio = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        uploadFile(file, '/audio/songs').then(async response => {
            const newAudio = {
                ...audio,
                url: response
            };

            setAudio(newAudio)
            await addAudio(newAudio);

            updateSong();
        })
    }


    const updateSong = (updatedField, updatedValue) => {
        setEditorState({
            ...editorState,
            songs: editorState.songs.map(s => {
                if (s.id === existingSong.id) {
                    if (updatedField && updatedValue) {
                        s[updatedField] = updatedValue;
                    } else {
                        s.name = name;
                        s.audio = audio;
                        s.rooms = [...songRooms];
                        s.behavior = behavior;
                        s.reduction = reduction;
                        s.fadeTime = fadeTime;
                    }
                }

                return {...s};
            })
        })
    }

    const saveSong = () => {
        updateSong();
        closeModal();
    }

    const rooms = editorState.rooms.map(room => ({
        id: room.id,
        name: room.name
    }));


    return audioMode ? (
        <AudioModal
            context={{
                url: existingSong.audio.url,
                level: 'song',
                field: 'audio'
            }}
            closeModal={() => {
                setAudioMode(false);
            }}
        />
    ) : (
        <div className="editor-modal">
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
                                <audio controls src={`${import.meta.env.VITE_DOMAIN}/${audio.url}`} />
                                <button onClick={() => handleEditAudio()}>Edit Audio</button>
                            </>
                        }
                        {!hasAudio &&
                            <>
                                <label htmlFor="song" className="uploadLabel">Add Song</label>
                                <input type="file" accept="audio/*" onChange={uploadAudio} id="song"/>
                            </>
                        }
                    </div>
                </div>
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Start Condition</div>
                        <select value={startCondition} onChange={handleConditionChange}>
                            <option value="room">In Room(s)</option>
                            <option value="off">Interactable</option>
                        </select>
                    </div>
                    <div className="modal-field">
                        <div className="modal-field-label">Play Behavior</div>
                        <select value={behavior} onChange={handleBehaviorChange}>
                            <option value="overlap">Play On Top</option>
                            <option value="replace">Replace</option>
                        </select>
                    </div>
                </div>
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Fade Time (in seconds)</div>
                        <input type="number" min={0} max={10} onInput={handleFadeTimeChange} value={fadeTime}/>
                    </div>
                    {behavior === 'overlap' && 
                        <div className="modal-field">
                            <div className="modal-field-label">% to Reduce Existing Audio</div>
                            <input type="number" min={0} max={99} step={1} onInput={handleReductionChange} value={reduction}/>
                        </div>
                    }
                </div>
                <div className="modal-field">
                    <Multipicker
                        list={songRooms}
                        source={rooms}
                        setList={(newList) => { console.log("updatin'"); setSongRooms(newList)}}
                        title='Rooms'
                    />
                    
                </div>
            </div>

            <div className="modal-footer">
                <button className="modal-footer-button action-btn" onClick={saveSong}>Done</button>
            </div>
        </div>
    );
}