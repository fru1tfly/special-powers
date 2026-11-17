import { useContext, useRef, useState, useEffect } from "react";
import { EditorContext, SetEditorContext } from "../EditorContext";
import AudioModal from "./AudioModal";
import AudioPreview from "../AudioPreview";
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

    const [audio, setAudio] = useState(existingSong.audio ? {...existingSong.audio} : new GameAudio());
    const [name, setName] = useState(existingSong.name ?? 'New Song');
    
    const [fadeInTime, setFadeInTime] = useState(existingSong.fadeInTime ?? 0);
    const [fadeOutTime, setFadeOutTime] = useState(existingSong.fadeOutTime ?? 0);

    const [behavior, setBehavior] = useState(existingSong.behavior ?? 'overlap');
    const [reduction, setReduction] = useState(existingSong.reduction ?? 0);

    const [songRooms, setSongRooms] = useState(existingSong.rooms ?? []);

    const [audioMode, setAudioMode] = useState(false);

    // Re-sync local state when a different song is opened
    useEffect(() => {
        setAudio(existingSong.audio ? {...existingSong.audio} : new GameAudio());
        setName(existingSong.name ?? 'New Song');
        setSongRooms(existingSong.rooms ?? []);
        setBehavior(existingSong.behavior ?? 'overlap');
        setFadeInTime(existingSong.fadeInTime ?? 0);
        setFadeOutTime(existingSong.fadeOutTime ?? 0);
        setReduction(existingSong.reduction ?? 0);
    }, [song]);


    const handleNameChange = (event) => {
        setName(event.target.value);
        updateSong({ name: event.target.value });
    }

    const handleBehaviorChange = (event) => {
        setBehavior(event.target.value);
        updateSong({ behavior: event.target.value });
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
        updateSong({ reduction: val });
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
        updateSong({ fadeInTime: val });
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
        updateSong({ fadeOutTime: val });
    }

    const handleEditAudio = () => {
        setAudioMode(true);
    }

    const hasAudio = existingSong && existingSong.audio && existingSong.audio.url;

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

            updateSong({ audio: newAudio });
        })
    }


    const updateSong = (overrides = {}) => {
        setEditorState({
            ...editorState,
            songs: editorState.songs.map(s => s.id !== existingSong.id ? s : {
                ...s,
                name,
                audio,
                rooms: [...songRooms],
                behavior,
                reduction,
                fadeInTime,
                fadeOutTime,
                ...overrides
            })
        });
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
                url: audio.url,
                level: 'song',
                field: 'audio'
            }}
            closeModal={(newAudio) => {
                setAudio(newAudio);
                updateSong({ audio: newAudio });
                setAudioMode(false);
            }}
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
                <div className="modal-field">
                    <Multipicker
                        list={songRooms}
                        source={rooms}
                        setList={(newList) => {
                            setSongRooms(newList);
                            updateSong({ rooms: [...newList] });
                        }}
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