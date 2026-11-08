import { useState, useEffect } from 'react'

import EditorCanvas from "./EditorCanvas"
import EditorMenu from './EditorMenu'
import { EditorContext, SetEditorContext } from './EditorContext'

import './editor.css'
import EditorModal from './modals/EditorModal'
import { EditorInputHandler } from './EditorInputHandler'

import { getRoomAssetCount, loadRoomAssets } from '../gameData/gameDataHelper'
import { useGetGameData } from '../hooks/GameDataHelper'
import Preloader from '../common/Preloader'


export default function Editor() {
    
    const [editorState, setEditorState] = useState(
        () => JSON.parse(localStorage.getItem('editorState')) ?? {
            rooms: [],
            songs: [],
            selectedRoom: '',
            selectedInteractable: null
        }
    );

    const updateEditorState = (newState) => {
        setEditorState(newState)
        localStorage.setItem('editorState', JSON.stringify(newState))
    }

    const setState = (gameData) => {
        const localState = localStorage.getItem('editorState');

        if (!localState) {
            const newState = {
                ...gameData,
                selectedRoom: '',
                selectedInteractable: null
            };
            updateEditorState(newState);
            return newState;
        }

        return JSON.parse(localState);
    }

    return (
        <EditorContext.Provider value={editorState}>
            <SetEditorContext.Provider value={updateEditorState}>
                <Preloader playBtn={false} setState={setState}>
                    <EditorCanvas/>
                    <EditorMenu/>
                    {editorState.selectedInteractable &&
                        <EditorModal/>
                    }
                    {!editorState.selectedInteractable && !editorState.selectedSong &&
                        ( 
                            <div className="help-text">
                                <div className="help-text-item">
                                    <span className="key-control">Ctrl</span>
                                    <span className="instruction-text">+</span>
                                    <span className="control-icon"><img src={`${import.meta.env.BASE_URL}scroll.png`} /></span>
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
                </Preloader>
            </SetEditorContext.Provider>
        </EditorContext.Provider>
    )
}