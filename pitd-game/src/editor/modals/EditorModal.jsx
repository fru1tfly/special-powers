import { EditorContext, SetEditorContext } from "../EditorContext";
import { useContext, useEffect, useState, useSyncExternalStore } from "react";
import { interactableFormValues } from "../../gameData/Interactables";
import { useUploadFile } from "../../hooks/files/useUploadFile";
import { startShapeMode, shapeModeSubscribe, getShapeMode, cameraOffset, startMoveMode, moveModeSubscribe, getMoveMode, on } from "../EditorInputHandler";
import { useGetInteractable, useUpdateInteractable } from "../../hooks/editor/InteractableHelper";
import { Vector2 } from "../../gameTypes/Vector";
import { addImage } from "../../gameData/assetManager";
import AnimationModal from "./AnimationModal";
import { cursorImages, cursors } from "../../gameData/cursors";
import { hasArea, hasPosition } from "../../gameData/Interactables";
import FadeModal from "./FadeModal";

const TYPES = {
    '--None--': '',
    'Art': 'Art',
    'Door': 'Door',
    'Key': 'Key',
    'Background': 'Background',
    'Move Point': 'MovePoint',
    'Animated Object': 'AnimatedObject'
}

export default function EditorModal() {
    const editorState = useContext(EditorContext);
    const setEditorState = useContext(SetEditorContext);

    const shapeMode = useSyncExternalStore(shapeModeSubscribe, getShapeMode);
    const moveMode = useSyncExternalStore(moveModeSubscribe, getMoveMode);

    const [animMode, setAnimMode] = useState(false);
    const [fadeMode, setFadeMode] = useState(false);

    const [animField, setAnimField] = useState('');
    const [fadeField, setFadeField] = useState('');

    const { uploadFile } = useUploadFile();

    const selectedInteractable = useGetInteractable();
    const updateInteractable = useUpdateInteractable();

    const onShapeAdd = shape => {
        updateInteractable({
            ...selectedInteractable,
            points: [...shape]
        });
    };

    const onMoveItem = newPosition => {
        updateInteractable({
            ...selectedInteractable,
            points: [newPosition]
        });
    };

    useEffect(() => {
        const removeShapeAdd = on('shapeAdd', onShapeAdd);
        const removeMoveItem = on('moveItem', onMoveItem);

        return () => {
            removeShapeAdd();
            removeMoveItem();
        }
    }, [selectedInteractable, updateInteractable]);


    const handleNameChange = (event) => {
        updateInteractable({
            ...selectedInteractable,
            name: event.target.value
        })
    }

    const handleTypeChange = (event) => {
        const oldType = selectedInteractable.objectType;

        if (oldType) {
            const oldFields = interactableFormValues[oldType];
            Object.keys(oldFields).forEach(f => delete selectedInteractable[f]);
        }
        updateInteractable({
            ...selectedInteractable,
            objectType: event.target.value
        })
    }

    const handleFormValueChange = (varName, event, isCheckbox = false) => {
        if (isCheckbox) { 
            updateInteractable({
                ...selectedInteractable,
                [varName]: event.target.checked
            })
        } else {
            updateInteractable({
                ...selectedInteractable,
                [varName]: event.target.value
            })
        }
    }

    const getOptions = (optionType, formValue) => {
        switch (optionType) {
            case 'rooms': {
                
                return [
                    (<option key="none">--Select--</option>),
                    editorState.rooms.map(room => {
                        if (room.id === editorState.selectedRoom) return null;

                        const opts = {};
                        if (selectedInteractable[formValue] === room.id) {
                            opts['selected'] = 'selected';
                        }

                        return (<option {...opts} key={room.id} value={room.id}>{room.name}</option>)
                    }).filter(op => op !== null)
                ]
            }
            case 'keys': {
                return [
                    (<option>--Select--</option>),
                    editorState.rooms.reduce((keys, room) => {
                        room.interactables.forEach(int => {
                            if (int.objectType === 'Key') {
                                keys = [...keys, int];
                            }
                        });

                        return keys;
                    }, []).map(key => {
                        const opts = {};
                        if (selectedInteractable[formValue] === key.id) {
                            opts['selected'] = 'selected';
                        }

                        return (<option {...opts} value={key.id}>{key.name}</option>)
                    })
                ];
            }
            case 'cursors': {
                return [
                    (<option>--Select--</option>),
                    Object.keys(cursorImages).map((cursor) => {
                        const opts = {};
                        if (selectedInteractable[formValue] === cursorImages[cursor]) {
                            opts['selected'] = 'selected';
                        }
                        return (<option {...opts} value={cursor}>{cursor}</option>)
                    })
                ];
            }

            case 'transitionTypes': {
                return [
                    ['none', 'sprites', 'fade'].map(tType => {
                        const opts = {};
                        if (selectedInteractable[formValue] === tType) {
                            opts['selected'] = 'selected';
                        }
                        return (<option {...opts} value={tType}>{tType}</option>)
                    })
                ]
            }
        }
    }

    const uploadSprite = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        uploadFile(file, '/images/sprites').then(async response => {
            const imgUrl = response;

            await addImage(imgUrl);

            updateInteractable({
                ...selectedInteractable,
                assets: [imgUrl]
            });
        });
    }

    const deletePhoto = (img) => {
        updateInteractable({
            ...selectedInteractable,
            assets: selectedInteractable.assets.filter(i => i !== img)
        });
    }

    const startWorldEdit = () => {
        if (hasArea(selectedInteractable.objectType)) {
            updateInteractable({
                ...selectedInteractable,
                points: []
            });

            startShapeMode();
        } else if (hasPosition(selectedInteractable.objectType)) {
            let point = selectedInteractable.points.length > 0 
                ? selectedInteractable.points[0] 
                : new Vector2(-cameraOffset.x, -cameraOffset.y);

            if (selectedInteractable.points.length === 0) {
                updateInteractable({
                    ...selectedInteractable,
                    points: [point]
                });
            }

            startMoveMode(selectedInteractable.id, point, selectedInteractable.assets[0]);
        }

    }

    let worldEditText = 'Draw Area';
    if (hasArea(selectedInteractable.objectType)) {
        if (selectedInteractable.points.length > 0) {
            worldEditText = 'Redraw Area';
        }
    } else if (hasPosition(selectedInteractable.objectType)) {
        if (selectedInteractable.points.length > 0) {
            worldEditText = 'Edit Position';
        } else {
            worldEditText = 'Set Position';
        }
    }

    const deselectInteractable = () => {
        setEditorState({
            ...editorState,
            selectedInteractable: null
        })
    }

    const deleteSelected = () => {
        setEditorState({
            ...editorState,
            rooms: editorState.rooms.map(r => {
                if (r.id === editorState.selectedRoom) {
                    r.interactables = r.interactables.filter(i => i.id !== editorState.selectedInteractable)
                }
                return r;
            }),
            selectedInteractable: null
        })
    }

    const handleEditAnimation = (fieldName) => {
        setAnimField(fieldName);
        setAnimMode(true);
    }

    const handleEditFade = (fieldName) => {
        setFadeField(fieldName);
        setFadeMode(true);
    }

    const handleCloseAnimation = () => {
        setAnimMode(false);
    }

    const handleCloseFade = () => {
        setFadeMode(false);
    }

    return shapeMode ? (
        <div className="help-text">
            <div className="help-text-item">
                <span className="control-icon"><img src={`${import.meta.env.BASE_URL}mouse.png`}/></span>
                <span className="instruction-text">Place New Vertex</span>
            </div>
            <div className="help-text-item">
                <span className="key-control">Esc</span>
                <span className="instruction-text">Cancel</span>
            </div>
            <div className="help-text-item">
                <span className="key-control">Enter</span>
                <span className="instruction-text">Complete Shape</span>
            </div>
            
        </div>
    ) : moveMode ? (
        <div className="help-text">
            <div className="help-text-item">
                <span className="control-icon"><img src={`${import.meta.env.BASE_URL}mouse.png`}/></span>
                <span className="instruction-text">Move Item</span>
            </div>
            <div className="help-text-item">
                <span className="key-control">Esc</span>
                <span className="instruction-text">Cancel</span>
            </div>
            <div className="help-text-item">
                <span className="key-control">Enter</span>
                <span className="instruction-text">Done</span>
            </div>
        </div>
    ) : animMode ? (
        <AnimationModal animatedField={animField} closeModal={handleCloseAnimation} />
    ) : fadeMode ? (
        <FadeModal fadeField={fadeField} closeModal={handleCloseFade} />
    ) : (
        <div className="editor-modal">
            <div className="modal-body">
                <div className="modal-section">
                    <div className="modal-field">
                        <div className="modal-field-label">Name</div>
                        <input type="text" value={selectedInteractable.name} onInput={handleNameChange}/>
                    </div>
                    <div className="modal-field">
                        <div className="modal-field-label">Type</div>
                        <select onChange={handleTypeChange} value={selectedInteractable.objectType}>
                            {Object.keys(TYPES).map(t => { 
                                return (<option key={TYPES[t]} value={TYPES[t]}>{t}</option>); 
                            })}
                        </select>
                    </div>
                    {
                        selectedInteractable.objectType && Object.keys(interactableFormValues[selectedInteractable.objectType]).map(formValue => {
                            const def = interactableFormValues[selectedInteractable.objectType][formValue];
                            if (typeof def === 'boolean') return;

                            if (def.visible && !def.visibleFunc && !selectedInteractable[def.visible]) {
                                return;
                            }

                            if (def.visible && def.visibleFunc && !def.visibleFunc(selectedInteractable[def.visible])) {
                                return;
                            }

                            return (
                                <>
                                    <div key={formValue} className="modal-field">
                                        <div className="modal-field-label">{def.name}</div>
                                        {def.type === 'dropdown' && (
                                            <div className={def.options === 'cursors' ? 'dropdown-container dropdown-container-offset' : 'dropdown-container'}>
                                                <select onChange={(event) => handleFormValueChange(formValue, event)}>
                                                    {getOptions(def.options, formValue)}
                                                </select>
                                            </div>
                                        )}
                                        {def.type === 'slider' && (
                                            <div>
                                                <input 
                                                    type="range" 
                                                    onChange={(event) => handleFormValueChange(formValue, event)}
                                                    min={def.min}
                                                    max={def.max}
                                                    step={def.step}
                                                    value={selectedInteractable[formValue] ?? def.default}
                                                />
                                            </div>
                                        )}
                                        {def.type === 'checkbox' && (
                                            <div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedInteractable[formValue]} 
                                                    onChange={(event) => handleFormValueChange(formValue, event, true)}
                                                />
                                            </div>
                                        )}
                                        {def.type === 'photo' && selectedInteractable.assets.length === 0 && (
                                            <>
                                                <label htmlFor="sprite" className="uploadLabel">Add Photo</label>
                                                <input type="file" accept="image/*" onChange={uploadSprite} id="sprite" />
                                            </>
                                        )}
                                        {def.type === 'photo' && selectedInteractable.assets.length === 1 && (
                                            <>
                                                {selectedInteractable.assets.length > 0 &&
                                                    <div className="form-image-container">
                                                        <img className="form-image" src={ `${import.meta.env.VITE_DOMAIN}${selectedInteractable.assets[0]}`} />
                                                    </div>
                                                }
                                                <label htmlFor="sprite" className="uploadLabel">Swap Photo</label>
                                                <input type="file" accept="image/*" onChange={uploadSprite} id="sprite" />
                                            </>
                                        )}
                                        {def.type === 'animation' && (
                                            <>
                                                {selectedInteractable.assets.length > 0 &&
                                                    <div className="form-image-container">
                                                        <img className="form-image" src={ `${import.meta.env.VITE_DOMAIN}${selectedInteractable.assets[0]}`} />
                                                    </div>
                                                }
                                                <button onClick={() => handleEditAnimation(formValue)}>Edit Animation</button>
                                            </>
                                        )}

                                        {def.type === 'fade' && (
                                            <>
                                                <button onClick={() => handleEditFade(formValue)}>Edit Fade</button>
                                            </>
                                        )}

                                        {def.options === 'cursors' && 
                                            <div className="form-icon-container">
                                                {selectedInteractable[formValue] && 
                                                    <img 
                                                        className="form-icon" 
                                                        src={ `${import.meta.env.BASE_URL}${cursorImages[selectedInteractable[formValue]]}`} 
                                                    />
                                                }
                                            </div>
                                        }
                                    </div>
                                </>
                            )
                        })
                    }
                </div>
            </div>
            <div className="modal-footer">
                {selectedInteractable.objectType && (hasPosition(selectedInteractable.objectType) || hasArea(selectedInteractable.objectType)) && (
                    <button className="modal-footer-button" onClick={startWorldEdit}>
                        {worldEditText}
                    </button>
                )}
                <button className="modal-footer-button" onClick={deleteSelected}>Delete</button>
                <button className="modal-footer-button action-btn" onClick={deselectInteractable}>Done</button>
            </div>
        </div>
    );
}