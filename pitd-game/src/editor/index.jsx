import { useState, useEffect } from 'react'

import EditorCanvas from "./EditorCanvas"
import EditorMenu from './EditorMenu'
import { EditorContext, SetEditorContext } from './EditorContext'

import './editor.css'
import EditorModal from './EditorModal'
import { EditorInputHandler } from './EditorInputHandler'

import { loadRoomAssets } from '../gameData/gameDataHelper'
import { useGetGameData } from '../hooks/GameDataHelper'

export default function Editor() {
    const getGameData = useGetGameData();
    const [loaded, setLoaded] = useState(false);
    const [editorState, setEditorState] = useState(
        () => JSON.parse(localStorage.getItem('editorState')) ?? {
            rooms: [],
            selectedRoom: '',
            selectedInteractable: null
        }
    );

    useEffect(() => {
        const init = async () => {
            const gameData = (await getGameData()).data;

            if (!gameData.version && !gameData.rooms) {
                console.error('UNABLE TO LOAD GAME FILE');
                return;
            }
                
                if (!editorState.version || editorState.version < gameData.version) {
                    updateEditorState(gameData);

                    await Promise.all(gameData.rooms.flatMap(room => loadRoomAssets(room)));
                } else {
                    await Promise.all(editorState.rooms.flatMap(room => loadRoomAssets(room)));
                }

                
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
                        {!editorState.selectedInteractable && 
                            ( 
                                <div className="help-text">
                                    <div className="help-text-item">
                                        <span className="control-icon"><img src={`${import.meta.env.BASE_URL}/scroll.png`} /></span>
                                        <span className="instruction-text">Scroll to Zoom</span>
                                    </div>
                                    <div className="help-text-item">
                                        <span className="key-control">Space</span>
                                        <span className="instruction-text">Hold & Drag to Move Camera</span>
                                    </div>
                                </div>
                            )
                        }
                        <EditorInputHandler/>
                    </SetEditorContext.Provider>
                </EditorContext.Provider>
            }
        </>
    )
}