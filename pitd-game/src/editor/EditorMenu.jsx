import { useContext, useState } from "react"
import EditorSidebar from "./EditorSidebar"
import { EditorContext, SetEditorContext } from "./EditorContext"
import { Room, Interactable, Song } from "../gameTypes/LevelObjects"
import { useUploadFile } from "../hooks/files/useUploadFile"
import { useSaveGameData } from "../hooks/GameDataHelper"
import SongModal from "./modals/SongModal"

export default function EditorMenu() {

    const editorState = useContext(EditorContext)
    const setEditorState = useContext(SetEditorContext)
    const { uploadFile } = useUploadFile();
    const { saveGameData } = useSaveGameData();

    const [saving, setSaving] = useState(false);

    const selectedRoom = editorState.rooms.find(r => r.id === editorState.selectedRoom)
    const selectedRoomIndex = editorState.rooms.indexOf(selectedRoom);
    const selectedInteractable = selectedRoom?.interactables.find(i => i.id === editorState.selectedInteractable)
    const selectedIntIndex = selectedRoom?.interactables.indexOf(selectedInteractable)
    const selectedSong = editorState.songs?.find(s => s.id === editorState.selectedSong)

    const handleAddRoom = () => {
        const newRoom = new Room()

        setEditorState({
            ...editorState,
            rooms: [ ...editorState.rooms, newRoom],
            selectedRoom: newRoom.id,
            selectedInteractable: null
        })
    }

    const handleAddSong = () => {
        const newSong = new Song();

        setEditorState({
            ...editorState,
            songs: [...editorState.songs ?? [], newSong],
            selectedSong: newSong.id
        });
    }

    const selectRoom = (roomId) => {
        setEditorState({
            ...editorState,
            selectedRoom: roomId,
            selectedInteractable: null
        })
    }

    const selectSong = (songId) => {
        setEditorState({
            ...editorState,
            selectedSong: songId,
            selectedInteractable: null
        })
    }

    const deleteRoom = (roomId) => {
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.filter(r => r.id !== roomId),
            selectedRoom: null,
            selectedInteractable: null
        })
    }

    const deleteSong = (songId) => {
        setEditorState({
            ...editorState,
            songs: editorState.songs.filter(s => s.id !== songId),
            selectedSong: editorState.selectedSong === songId ? null : editorState.selectedSong
        })
    }

    const handleNameChange = (event) => {
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.map(r => {
                if (r.id === selectedRoom.id) {
                    r.name = event.target.value;
                }
                return r;
            })
        })
    }

    const saveRoomData = async () => {
        setSaving(true);
        await saveGameData({ 
            rooms: editorState.rooms,
            songs: editorState.songs
        });
        setTimeout(() => setSaving(false), 200);
    }

    const loadGameData = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.readAsText(file, 'UTF-8');
        reader.onload = ({ target }) => {
            setEditorState(JSON.parse(target.result))
        }
    }

    const uploadBackground = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        uploadFile(file, '/images/backgrounds').then(response => {
            const imgUrl = response;
            setEditorState({
                ...editorState,
                rooms: editorState.rooms.map(r => {
                    if (r.id === selectedRoom.id) {
                        r.imgUrl = imgUrl;
                    }
                    return r;
                })
            })
        });
    }

    const handleNewInteractable = () => {
        const newInteractable = new Interactable();
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.map(r => {
                if (r.id === selectedRoom.id) {
                    r.interactables = [...r.interactables, newInteractable]
                }
                return r;
            }),
            selectedInteractable: newInteractable.id
        })
    }

    const selectInteractable = (intId) => {
        setEditorState({
            ...editorState,
            selectedInteractable: intId,
            selectedSong: null
        })
    }

    const deleteInteractable = (intId) => {
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.map(r => {
                if (r.id === selectedRoom.id) {
                    r.interactables = r.interactables.filter(i => i.id !== intId)
                }
                return r;
            }),
            selectedInteractable: editorState.selectedInteractable === intId ? null : editorState.selectedInteractable
        })
    }

    const goIncreaseLayer = () => {
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.map(r => {
                if (r.id === selectedRoom.id) {
                    r.interactables = swap(r.interactables, selectedIntIndex, selectedIntIndex + 1)
                }
                return r;
            })
        })
    }

    const goDecreaseLayer = () => {
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.map(r => {
                if (r.id === selectedRoom.id) {
                    r.interactables = swap(r.interactables, selectedIntIndex, selectedIntIndex - 1)
                }
                return r;
            })
        })
    }

    const roomIncreaseLayer = () => {
        setEditorState({
            ...editorState,
            rooms: swap(editorState.rooms, selectedRoomIndex, selectedRoomIndex + 1)
        })
    }

    const roomDecreaseLayer = () => {
        setEditorState({
            ...editorState,
            rooms: swap(editorState.rooms, selectedRoomIndex, selectedRoomIndex - 1)
        })
    }

    const deselectSong = () => {
        setEditorState({
            ...editorState,
            selectedSong: null
        })
    }

    const swap = (list, a, b) => {
        const copy = [...list];
        const tempA = copy[a];

        copy[a] = copy[b];
        copy[b] = tempA;

        return copy;
    }

    const goUpButtonClass = selectedIntIndex === selectedRoom?.interactables.length - 1 || !selectedInteractable ? 'disabled-btn' : '';
    const goDownButtonClass = selectedIntIndex === 0 || !selectedInteractable ? 'disabled-btn' : '';
    const goDeleteButtonClass = !selectedInteractable ? 'disabled-btn' : '';

    const roomUpButtonClass = selectedRoomIndex === 0 ? 'disabled-btn' : '';
    const roomDownButtonClass = selectedRoomIndex === editorState.rooms.length - 1 ? 'disabled-btn' : '';
    const roomDeleteClass = !selectedRoom ? 'disabled-btn' : '';

    const saveButtonClass = `big-button ${saving ? 'disabled-btn' : '' }`;
    const saveButtonText = saving ? 'Saving...' : 'Save';

    return (
        <div className="menu">
            <EditorSidebar>
                <div className="section-label">Rooms</div>
                <div className="btn-row">
                    <button 
                        onClick={roomDecreaseLayer} 
                        className={roomUpButtonClass}
                    >⬆</button>
                    <button 
                        onClick={roomIncreaseLayer} 
                        className={roomDownButtonClass}
                    >⬇</button>
                    <button 
                        onClick={(event) => { event.stopPropagation(); deleteRoom(selectedRoom.id) }}
                        className={roomDeleteClass}
                    >Delete</button>
                </div>
                <button onClick={handleAddRoom} className="action-btn">New Room</button>
                <div className="section-container" id="roomList">
                    {
                        editorState.rooms.map(room => (
                            <div 
                                key={room.id}
                                className={
                                    room.id === selectedRoom?.id 
                                        ? 'section-item section-item-selected' 
                                        : 'section-item'
                                }
                                onClick={() => selectRoom(room.id)}
                            >
                                <div className="section-item-title">
                                    {room.name}
                                </div>
                            </div>
                        ))
                    }
                </div>
                <div className="section-label">Songs</div>
                <button onClick={handleAddSong} className="action-btn">New Song</button>
                <div className="section-container section-container-small" id="songList">
                    {
                        editorState.songs?.map(song => (
                            <div 
                                key={song.id}
                                className={
                                    song.id === selectedSong?.id 
                                        ? 'section-item section-item-selected' 
                                        : 'section-item'
                                }
                                onClick={() => selectSong(song.id)}
                            >
                                <div className="section-item-title">
                                    {song.name}
                                </div>
                                <button onClick={(event) => {
                                    event.stopPropagation()
                                    deleteSong(song.id)
                                }}>Delete</button>
                            </div>
                        ))
                    }
                </div>
                <button onClick={saveRoomData} className={saveButtonClass}>{saveButtonText}</button>
            </EditorSidebar>
            {selectedRoom && 
                <EditorSidebar>
                    <div className="section-label">Room Name</div>
                    <input type="text" value={selectedRoom.name} onChange={handleNameChange} />
                    {/* <label htmlFor="bg" className="uploadLabel">
                        {selectedRoom.imgUrl ? 'Swap ' : 'Add '}
                        Background
                    </label>
                    <input type="file" accept="image/*" onChange={uploadBackground} id="bg" /> */}
                    <button id="newShape" onClick={handleNewInteractable} className="action-btn">New Game Object</button>

                    <div className="section-label">Game Objects</div>
                    <div className="btn-row">
                        <button onClick={goIncreaseLayer} className={goUpButtonClass}>⬆</button>
                        <button onClick={goDecreaseLayer} className={goDownButtonClass}>⬇</button>
                        <button onClick={() => deleteInteractable(selectedInteractable.id)} className={goDeleteButtonClass}>Delete</button>
                    </div>
                    <div className="section-container" id="shapeList">
                        {selectedRoom.interactables.toReversed().map((i, ind) => (
                            <div
                                key={i.id}
                                className={
                                    i.id === selectedInteractable?.id 
                                        ? 'section-item section-item-selected' 
                                        : 'section-item'
                                }
                                onClick={() => selectInteractable(i.id)}
                            >
                                 <div className="section-item-title">
                                    {i.name}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <button onClick={() => deleteRoom(selectedRoom.id)}>Delete Room</button>
                </EditorSidebar>
            }
            {selectedSong && 
                <SongModal 
                    song={selectedSong.id}
                    closeModal={deselectSong}
                />
            }
        </div>
    )
}