import { useContext, useState } from "react";
import { EditorContext, SetEditorContext } from "../EditorContext";
import { addAudio } from "../../gameData/assetManager";
import { useUploadFile } from "../../hooks/files/useUploadFile";
import AudioModal from "./AudioModal";

export default function GameModal() {
    const editorState = useContext(EditorContext);
    const setEditorState = useContext(SetEditorContext);

    const [audioMode, setAudioMode] = useState(false);
    const [audioField, setAudioField] = useState('');

    const { uploadFile } = useUploadFile();

    const getRoomOptions = () => {
        return [
            (<option key="">--Select--</option>),
            editorState.rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
            ))
        ]
    }

    const handleStartingRoomChange = (event) => {
        setEditorState({
            ...editorState,
            startingRoom: event.target.value
        })
    }

    const uploadAudio = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        uploadFile(file, '/audio').then(async res => {
            const audioDef = {
                url: res
            };

            await addAudio(audioDef);

            setEditorState({
                ...editorState,
                startingSong: audioDef
            })
        })
    }

    const startingSongEdit = () => {
        setAudioMode(true);
        setAudioField('startingSong');
    }

    return audioMode ? (
        <AudioModal
            context={{
                level: 'top',
                field: audioField,
                url: editorState.startingSong.url
            }}
            closeModal={() => setAudioMode(false)}
        />
    ) : 
    (
        <div className="editor-modal">
            <div className="modal-body">
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Starting Room</div>
                        <div className="dropdown-container">
                            <select onChange={handleStartingRoomChange} value={editorState.startingRoom ?? ""}>
                                {getRoomOptions()}
                            </select>
                        </div>
                    </div>
                    <div className="modal-field">
                        <div className="modal-field-label">Starting Song</div>
                        {!editorState.startingSong &&
                            <>
                                <label htmlFor="song" className="uploadLabel">Add Song</label>
                                <input type="file" accept="audio/*" onChange={uploadAudio} id="song" />
                            </>
                        }
                        {editorState.startingSong &&
                            <>
                                <audio controls src={`${import.meta.env.VITE_DOMAIN}/${editorState.startingSong.url}`} />
                                <button onClick={startingSongEdit}>Edit Song</button>
                            </>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
}