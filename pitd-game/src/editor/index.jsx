import { useState, useEffect } from 'react'

import EditorCanvas from "./EditorCanvas"
import EditorMenu from './EditorMenu'
import { EditorContext, SetEditorContext } from './EditorContext'

import './editor.css'
import EditorModal from './EditorModal'
import { EditorInputHandler } from './EditorInputHandler'

import { loadRoomAssets } from '../gameData/gameDataHelper'

export default function Editor() {
    const [loaded, setLoaded] = useState(false);
    const [editorState, setEditorState] = useState(
        () => JSON.parse(localStorage.getItem('editorState')) ?? 
        { 
            rooms: [], 
            selectedRoom: null,
            selectedInteractable: null
        }
    )

    useEffect(() => {
        const init = async () => {
            await Promise.all(editorState.rooms.flatMap(room => loadRoomAssets(room)));
            setLoaded(true);
        }

        init();

        return () => {
        }

    }, []);

    const updateEditorState = (newState) => {
        setEditorState(newState)
        localStorage.setItem('editorState', JSON.stringify(newState))
    }

    return (
        <>
            {loaded && 
                <EditorContext.Provider value={editorState}>
                    <SetEditorContext.Provider value={updateEditorState}>
                        <EditorMenu/>
                        <EditorCanvas/>
                        {editorState.selectedInteractable && 
                            <EditorModal/>
                        }
                        <EditorInputHandler/>
                    </SetEditorContext.Provider>
                </EditorContext.Provider>
            }
        </>
    )
}