import { useContext, useState } from "react"
import EditorSidebar from "./EditorSidebar"
import { EditorContext, SetEditorContext } from "./EditorContext"
import { Room, Interactable } from "../gameTypes/LevelObjects"
import { useUploadFile } from "../hooks/files/useUploadFile"
import { useSaveGameData } from "../hooks/GameDataHelper"

export default function EditorMenu() {

    const editorState = useContext(EditorContext)
    const setEditorState = useContext(SetEditorContext)
    const { uploadFile } = useUploadFile();
    const { saveGameData } = useSaveGameData();

    const selectedRoom = editorState.rooms.find(r => r.id === editorState.selectedRoom)
    const selectedInteractable = selectedRoom?.interactables.find(i => i.id === editorState.selectedInteractable)
    const selectedIntIndex = selectedRoom?.interactables.indexOf(selectedInteractable)

    const handleAddRoom = () => {
        const newRoom = new Room()

        setEditorState({
            ...editorState,
            rooms: [ ...editorState.rooms, newRoom],
            selectedRoom: newRoom.id,
            selectedInteractable: null
        })
    }

    const selectRoom = (roomId) => {
        setEditorState({
            ...editorState,
            selectedRoom: roomId,
            selectedInteractable: null
        })
    }

    const deleteRoom = (roomId) => {
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.filter(r => r.id !== roomId),
            selectedRoom: editorState.selectedRoom === roomId ? null : editorState.selectedRoom,
            selectedInteractable: null
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

    const saveRoomData = () => {
        saveGameData({ rooms: editorState.rooms });
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
            selectedInteractable: intId
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

    const increaseLayer = () => {
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.map(r => {
                if (r.id === selectedRoom.id) {
                    r.interactables = swapInteractables(r.interactables, selectedIntIndex, selectedIntIndex + 1)
                }
                return r;
            })
        })
    }

    const decreaseLayer = () => {
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.map(r => {
                if (r.id === selectedRoom.id) {
                    r.interactables = swapInteractables(r.interactables, selectedIntIndex, selectedIntIndex - 1)
                }
                return r;
            })
        })
    }

    const swapInteractables = (ints, a, b) => {
        const copy = [...ints];
        const tempA = copy[a];

        copy[a] = copy[b];
        copy[b] = tempA;

        return copy;
    }

    const upButtonClass = selectedIntIndex === selectedRoom?.interactables.length - 1 || !selectedInteractable ? 'disabled-btn' : '';
    const downButtonClass = selectedIntIndex === 0 || !selectedInteractable ? 'disabled-btn' : '';
    const deleteButtonClass = !selectedInteractable ? 'disabled-btn' : '';

    return (
        <div className="menu">
            <EditorSidebar>
                <button onClick={handleAddRoom} className="action-btn">New Room</button>
                <div className="section-label">Rooms</div>
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
                                <button onClick={(event) => {
                                    event.stopPropagation()
                                    deleteRoom(room.id)
                                }}>Delete</button>
                            </div>
                        ))
                    }
                </div>
                <button onClick={saveRoomData}>Save Room Data</button>
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
                        <button onClick={increaseLayer} className={upButtonClass}>⬆</button>
                        <button onClick={decreaseLayer} className={downButtonClass}>⬇</button>
                        <button onClick={() => deleteInteractable(selectedInteractable.id)} className={deleteButtonClass}>Delete</button>
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
        </div>
    )
}